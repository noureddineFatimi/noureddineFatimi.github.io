import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { listGithubReposTool } from "../tools/listeGithubReposTool";
import { analyzeGithubRepoTool } from "../tools/listeMetadataRepoTool";
import { getRetrieverTool } from "../tools/portfolioRetrieverTool";
import { readGithubFilesTool } from "../tools/readerGithubReposFileTool";
import { getGithubTreeTool } from "../tools/retrieveGithubRepoTreeTool";
import { systemPrompt } from "./systemPrompt";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { requireEnv } from "../utils";

export async function createPortfolioAgent() {
  const retrieveTool = await getRetrieverTool();

  const model = new ChatOpenAI({
    model: requireEnv("LLM_MODEL"),
    apiKey: requireEnv("LLM_API_KEY"),
    configuration: {
      baseURL: requireEnv("LLM_BASE_URL"),
    },
  });

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
