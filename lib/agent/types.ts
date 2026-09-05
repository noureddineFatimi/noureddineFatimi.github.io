import { StoredMessage } from "@langchain/core/messages";

export interface TestAgentSession {
  runId: number;
  lastUpdateTime: string;
  messages: StoredMessage[]; 
}

export interface AgentSession {
  lastUpdateTime: string;
  messages: StoredMessage[]; 
}