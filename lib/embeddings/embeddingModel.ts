import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { requireEnv } from "../utils";

const provider = process.env.EMBEDDING_MODEL_PROVIDER;

if (!["HUGGINGFACE", "OPENROUTER"].includes(provider ?? "")) {
  throw new Error(
    "EMBEDDING_MODEL_PROVIDER must be OPENROUTER or HUGGINGFACE"
  );
}

export const embeddingModelParameters =
  provider === "HUGGINGFACE"
    ? {
        baseUrl: requireEnv("HF_EMBEDDING_BASE_URL"),
        model: requireEnv("HF_EMBEDDING_MODEL"),
        openAIApiKey: requireEnv("HF_API_KEY"),
      }
    : {
        baseUrl: requireEnv("OR_EMBEDDING_BASE_URL"),
        model: requireEnv("OR_EMBEDDING_MODEL"),
        openAIApiKey: requireEnv("OR_EMBEDDING_API_KEY"),
      };