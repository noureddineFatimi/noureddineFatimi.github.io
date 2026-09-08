import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createUIMessageStreamResponse } from "ai";
import { appendFile, mkdir } from "fs/promises";
import {
  mapStoredMessagesToChatMessages,
  HumanMessage,
  type BaseMessage,
  StoredMessage,
  AIMessage,
  mapChatMessagesToStoredMessages,
} from "@langchain/core/messages";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { requireEnv } from "../utils";
import { AgentSession } from "./types";
import { ReactAgent } from "langchain";
import { redis } from "../redis";

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

export function  getMessagesFromRedisSession(redisSession: AgentSession | null): BaseMessage[] {
  if (!redisSession) {
    return [];
  }
  return mapStoredMessagesToChatMessages(redisSession.messages, );
}

export function getLastMessages(previousMessages: BaseMessage[]): BaseMessage[] {
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

export async function setMessagesInRedisSession(sessionId: string, messages: StoredMessage[]) {
  return await redis.set(
    `agent-session-${sessionId}`,
    JSON.stringify({ lastUpdateTime: new Date().toISOString(),
                     messages: messages }),
    { ex: isNaN(Number(requireEnv("SESSION_TTL"))) ? 3600 : Number(requireEnv("SESSION_TTL")) }
  );
}

export async function handleChatRequest(agent: ReactAgent, question: string, sessionId: string) {
  if (!question || question.trim() === "") {
    return new Response("La question ne peut pas être vide.", { status: 400 });
  }
  if (question.length > 1000) {
    return new Response("La question est trop longue (max 1000 caractères).", { status: 400 });
  }

  const redisSession = await redis.get<AgentSession>(`agent-session-${sessionId}`);
  const previousMessages = getMessagesFromRedisSession(redisSession); // historique "propre" : que des tours human/ai
  const humanMessage = new HumanMessage(question);
  const messagesForModel = getLastMessages([...previousMessages, humanMessage]);

  const stream = agent.streamEvents({ messages: messagesForModel }, { version: "v2" });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream, {
      onFinal: async (completion: string) => {
          const updatedHistory = [...previousMessages, humanMessage, new AIMessage(completion)];
          const trimmed = getLastMessages(updatedHistory);
          await setMessagesInRedisSession(sessionId, mapChatMessagesToStoredMessages(trimmed));
        },
      }),
  });
}