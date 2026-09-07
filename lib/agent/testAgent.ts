import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { ReactAgent } from "langchain";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { TestAgentSession, AgentSession } from "./types";
import {createPortfolioAgent} from "./agent"
import {
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { requireEnv, redis } from "../utils";
import {getMessagesFromRedisSession, getLastMessages, setMessagesInRedisSession, initLogger, log} from "./utils"

export async function chatWithAgentInStreamingMode(agent: ReactAgent, question: string, sessionId: string) {
  try {
    if (!question || question.trim() === "") {
      return "La question ne peut pas être vide. Veuillez fournir une question valide.";
    }

    if (question.length > 1000) {
      return "La question est trop longue. Veuillez la raccourcir à moins de 1000 caractères.";
    }

    const redisSession = await redis.get<AgentSession>(`agent-session-${sessionId}`);

    const previousMessages: BaseMessage[] = getMessagesFromRedisSession(redisSession);

    previousMessages.push(new HumanMessage(question));

    let lastMessages: BaseMessage[] = getLastMessages(previousMessages);

    console.log("Historique envoyé au modèle : ")
    console.log("--------\n")
    console.log(lastMessages)
    console.log("--------\n\n\n")

    const llmResponse = await agent.streamEvents({ messages: lastMessages }, { version: "v3" });

     for await (const message of  llmResponse.messages) { //
      console.log(`--- New Message Stream ---`);
      for await (const delta of message.text) { 
        process.stdout.write(delta); 
      }
      console.log("\n");
    }

    const messages = (await llmResponse?.output)?.messages as BaseMessage[]

    const newStoredMessages = mapChatMessagesToStoredMessages(messages);

    await setMessagesInRedisSession(sessionId, newStoredMessages);

    const finalMessage = messages[messages?.length - 1]?.text ?? "Aucune réponse générée par l'agent.";

    console.log("final response apres fin de stream")
    console.log(finalMessage)

  } catch (error) {
    console.error("Erreur lors de l'appel à l'agent :", error);
    const finalMessage = "Une erreur est survenue lors de la communication avec l'agent.";
    console.log(finalMessage)
  }
}

async function testChatWithAgentInStreamingMode() {
  const agent = await createPortfolioAgent();
  const sessionId = crypto.randomUUID();
  const question1 = "Peux-tu me donner un résumé de portfolio de noureddine et de ses compétences ?";
   await chatWithAgentInStreamingMode(agent, question1, sessionId);
  const question2 = "Peux-tu me donner la liste des dépôts GitHub de noureddine ?";
   await chatWithAgentInStreamingMode(agent, question2, sessionId);
}

async function chatWithAgentInNormaleMode() {
  const agent = await createPortfolioAgent();
  const agentLogsFolderPath = "./logs/agentLogs";
  const runId = Math.floor(Date.now() / 1000);
  const logFile = `${agentLogsFolderPath}/test-agent-run-${runId}.log`;
  await initLogger(agentLogsFolderPath, runId, logFile);
  const rl = readline.createInterface({ input, output });

  const sessionId = crypto.randomUUID();

  console.log("Agent portfolio prêt. Tapez votre question (ou 'exit' pour quitter).\n");

  try {
    await redis.set(`agent-session-${sessionId}`, JSON.stringify({ runId, lastUpdateTime: new Date().toISOString(), messages: [] }), { ex: Number(requireEnv("SESSION_TTL")) });
  }
  catch (error) {
    console.error("Erreur lors de l'enregistrement de la session dans Redis :", error);
    await log(`ERREUR REDIS : ${error}`, logFile);
    return;
  }

  while (true) {
    try {
      const question = await rl.question("Question: ");

      if (question.trim().toLowerCase() === "exit") {
        break;
      }

      await log(`QUESTION: ${question}`, logFile);

      const redisSession = await redis.get<TestAgentSession>(`agent-session-${sessionId}`);

      const previousMessages: BaseMessage[] = mapStoredMessagesToChatMessages(redisSession?.messages ?? [], );
      
      previousMessages.push(new HumanMessage(question));

      let lastMessages: BaseMessage[] = previousMessages;

      if (previousMessages.length > 15) {
        const minimumStartIndex = previousMessages.length - 15;
        let sliceIndex = minimumStartIndex;
        for (let i = minimumStartIndex; i >= 0; i--) {
          if (previousMessages[i] instanceof HumanMessage) {
            sliceIndex = i;
            break;
          }
        }
        lastMessages = previousMessages.slice(sliceIndex);
      }
      
      console.log("Historique envoyé au modèle : ");
      console.log(lastMessages);

      const llmResponse = await agent.invoke({ messages: lastMessages });

      const newStoredMessages = mapChatMessagesToStoredMessages(llmResponse.messages as BaseMessage[],);

      await redis.set(`agent-session-${sessionId}`, JSON.stringify({ runId, lastUpdateTime: new Date().toISOString(), messages: newStoredMessages }), { ex: Number(requireEnv("SESSION_TTL")) });

      await log(`AGENT RESPONSE GRAPH :\n${JSON.stringify(llmResponse?.messages, null, 2)}`, logFile);
      
      await log(`=== END OF AGENT RESPONSE ===\n\n`, logFile);

      const finalMessage = llmResponse?.messages?.[llmResponse?.messages.length - 1];

      console.log(`Réponse: ${finalMessage?.content}`);

      console.log("\n---\n");
    } catch (error) {
      console.error("Erreur lors de la saisie ou de l'appel à l'agent :", error);
      await log(`ERREUR : ${error}`, logFile);
      await log(`=== END OF AGENT RESPONSE ===\n\n`, logFile);
    }
  }

  rl.close();
}

if (process.argv[1]?.endsWith("testAgent.ts")) {
  void testChatWithAgentInStreamingMode().catch(async (error) => {
    console.error("Erreur fatale de démarrage de l'agent :", error);
    process.exit(1);
  });
}