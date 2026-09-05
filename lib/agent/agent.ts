import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAgent, ReactAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { listGithubReposTool } from "../tools/listeGithubReposTool";
import { analyzeGithubRepoTool } from "../tools/listeMetadataRepoTool";
import { getRetrieverTool } from "../tools/portfolioRetrieverTool";
import { readGithubFilesTool } from "../tools/readerGithubReposFileTool";
import { getGithubTreeTool } from "../tools/retrieveGithubRepoTreeTool";
import { systemPrompt } from "./systemPrompt";
import { appendFile, mkdir } from "fs/promises";
import {
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
  HumanMessage,
  type BaseMessage,
  StoredMessage,
} from "@langchain/core/messages";
import { requireEnv, redis } from "../utils";
import { TestAgentSession, AgentSession } from "./types";

export async function initLogger(agentLogsFolderPath: string, runId: number, logFile: string) {
  await mkdir(agentLogsFolderPath, { recursive: true });
  await appendFile(logFile, `=== Agent run ${runId} ===\n\n`, "utf8");
}

export async function log(message: string, logFile: string) {
  await appendFile(
    logFile,
    `[${new Date().toISOString()}] ${message}\n`,
    "utf8",
  );
}

export async function createPortfolioAgent() {
  const retrieveTool = await getRetrieverTool();

  const model = new ChatOpenAI({
    model: requireEnv("LLM_MODEL"),
    apiKey: requireEnv("LLM_API_KEY"),
    configuration: {
      baseURL: requireEnv("LLM_BASE_URL"),
    },
  });
  //ajouter dans front end un limiteur sur l'input de user dans le chat pour eviter de depasser la limite de token du model dans un seul message et eviter le prompt injecton.

  return createAgent({
    name: "portfolio-Agent",
    systemPrompt,
    tools: [
      listGithubReposTool,
      analyzeGithubRepoTool,
      readGithubFilesTool,
      getGithubTreeTool,
      retrieveTool,
    ],
    model,
  });
}

function  getMessagesFromRedisSession(redisSession: AgentSession | null): BaseMessage[] {
  if (!redisSession) {
    return [];
  }
  return mapStoredMessagesToChatMessages(redisSession.messages, );
}

function getLastMessages(previousMessages: BaseMessage[]): BaseMessage[] {
  if (previousMessages.length <= 15) {
    return [...previousMessages];
  }

  const minimumStartIndex = previousMessages.length - 15;
  let sliceIndex = minimumStartIndex;

  for (let i = minimumStartIndex; i >= 0; i--) {
    if (previousMessages[i] instanceof HumanMessage) {
      sliceIndex = i;
      break;
    }
  }

  return previousMessages.slice(sliceIndex);
}

async function setMessagesInRedisSession(sessionId: string, messages: StoredMessage[]) {
  return await redis.set(
    `agent-session-${sessionId}`,
    JSON.stringify({ lastUpdateTime: new Date().toISOString(),
                     messages: messages }),
    { ex: isNaN(Number(requireEnv("SESSION_TTL"))) ? 3600 : Number(requireEnv("SESSION_TTL")) }
  );
}

export async function chatWithAgent(agent: ReactAgent, question: string, sessionId: string) {
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

    console.log("Historique envoyé au modèle : ");
    console.log(lastMessages);

    const llmResponse = await agent.invoke({ messages: lastMessages });

    const newStoredMessages = mapChatMessagesToStoredMessages(llmResponse.messages as BaseMessage[],);

    await setMessagesInRedisSession(sessionId, newStoredMessages);

    const finalMessage = llmResponse?.messages?.[llmResponse?.messages.length - 1];

    return finalMessage?.content ?? "Aucune réponse générée par l'agent.";

  } catch (error) {
    console.error("Erreur lors de l'appel à l'agent :", error);
    return "Une erreur est survenue lors de la communication avec l'agent.";
  }
}

async function testChatWithAgent() {
  const agent = await createPortfolioAgent();
  const sessionId = crypto.randomUUID();
  const question1 = "Peux-tu me donner un résumé de portfolio de noureddine et de ses compétences ?";
  const response1 = await chatWithAgent(agent, question1, sessionId);
  console.log("Réponse de l'agent :", response1);
  const question2 = "Peux-tu me donner la liste des dépôts GitHub de noureddine ?";
  const response2 = await chatWithAgent(agent, question2, sessionId);
  console.log("Réponse de l'agent :", response2);
}

async function main() {
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

if (process.argv[1]?.endsWith("agent.ts") || process.argv[1]?.endsWith("agent.js")) {
  void testChatWithAgent().catch(async (error) => {
    console.error("Erreur fatale de démarrage de l'agent :", error);
    process.exit(1);
  });
}