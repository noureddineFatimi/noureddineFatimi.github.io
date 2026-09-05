import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAgent } from "langchain";
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
import { Redis } from "@upstash/redis";
import {
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
  HumanMessage,
  type StoredMessage,
  type BaseMessage,
} from "@langchain/core/messages";

const agentLogsFolderPath = "./logs/agentLogs";

const runId = Math.floor(Date.now() / 1000);

const logFile = `${agentLogsFolderPath}/test-agent-run-${runId}.log`;

export async function initLogger() {
  await mkdir(agentLogsFolderPath, { recursive: true });
  await appendFile(logFile, `=== Agent run ${runId} ===\n\n`, "utf8");
}

export async function log(message: string) {
  await appendFile(
    logFile,
    `[${new Date().toISOString()}] ${message}\n`,
    "utf8",
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

interface AgentSession {
  runId: number;
  startTime: string;
  messages: StoredMessage[]; 
}

async function main() {
  await initLogger();
  const agent = await createPortfolioAgent();
  const rl = readline.createInterface({ input, output });

  const sessionId = crypto.randomUUID();

  console.log("Agent portfolio prêt. Tapez votre question (ou 'exit' pour quitter).\n");

  const redis = new Redis({
    url: requireEnv("UPSTASH_REDIS_REST_URL"),
    token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
  });

  try {
    await redis.set(`agent-session-${sessionId}`, JSON.stringify({ runId, startTime: new Date().toISOString(), messages: [] }), { ex: 7200 });
  }
  catch (error) {
    console.error("Erreur lors de l'enregistrement de la session dans Redis :", error);
    await log(`ERREUR REDIS : ${error}`);
    return;
  }

  while (true) {
    try {
      const question = await rl.question("Question: ");

      if (question.trim().toLowerCase() === "exit") {
        break;
      }

      await log(`QUESTION: ${question}`);

      const redisSession = await redis.get<AgentSession>(`agent-session-${sessionId}`);

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

      await redis.set(`agent-session-${sessionId}`, JSON.stringify({ runId, startTime: new Date().toISOString(), messages: newStoredMessages }), { ex: 7200 });

      await log(`AGENT RESPONSE GRAPH :\n${JSON.stringify(llmResponse?.messages, null, 2)}`);
      
      await log(`=== END OF AGENT RESPONSE ===\n\n`);

      const finalMessage = llmResponse?.messages?.[llmResponse?.messages.length - 1];

      console.log(`Réponse: ${finalMessage?.content}`);

      console.log("\n---\n");
    } catch (error) {
      console.error("Erreur lors de la saisie ou de l'appel à l'agent :", error);
      await log(`ERREUR : ${error}`);
      await log(`=== END OF AGENT RESPONSE ===\n\n`);
    }
  }

  rl.close();
}

if (process.argv[1]?.endsWith("agent.ts") || process.argv[1]?.endsWith("agent.js")) {
  void main().catch(async (error) => {
    console.error("Erreur fatale de démarrage de l'agent :", error);
    await log(`ERREUR FATALE : ${error}`);
    process.exit(1);
  });
}