import { createPortfolioAgent } from "@/lib/agent/agent";
import { handleChatRequest } from "@/lib/agent/utils";
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
  // rate limiting Upstash à vérifier ici, avant getAgent()
  const agent = await getAgent();
  return handleChatRequest(agent, question, sessionId);
}