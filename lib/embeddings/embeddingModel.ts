const provider = process.env.EMBEDDING_MODEL_PROVIDER;

if (!["HUGGINGFACE", "OPENROUTER"].includes(provider ?? "")) {
  throw new Error(
    "EMBEDDING_MODEL_PROVIDER must be OPENROUTER or HUGGINGFACE"
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
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