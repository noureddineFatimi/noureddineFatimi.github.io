import { StoredMessage } from "@langchain/core/messages";

export interface AgentSession {
  runId: number;
  startTime: string;
  messages: StoredMessage[]; 
}