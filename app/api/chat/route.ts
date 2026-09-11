export const maxDuration = 60;

import { createPortfolioAgent } from "@/lib/agent/agent";
import { getClientIp, handleChatRequest, isHasReachedRateLimit, restoreHistory } from "@/lib/agent/utils";
import { ReactAgent } from "langchain";

let agentPromise: Promise<ReactAgent> | null = null;
function getAgent() {
  if (!agentPromise) {
    agentPromise = createPortfolioAgent(); // instancié une seule fois, réutilisé tant que l'instance reste chaude
  }
  return agentPromise;
}

export async function POST(req: Request) {
  const { sessionId, question } = await req.json();
  if (!sessionId || typeof question !== "string") {
    return new Response("Requête invalide.", { status: 400 });
  }
  const ip = getClientIp(req)
  if ((await isHasReachedRateLimit(ip))) {
    return new Response("Rate Limit atteint", { status: 429 });
  } 
  const agent = await getAgent();
  return handleChatRequest(agent, question, sessionId);
}
 //edit system prompt et createAgent
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return new Response("sessionId manquant", { status: 400 });
  return Response.json(await restoreHistory(sessionId));
}