import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";

// Charge les variables d'environnement de Next.js
dotenv.config({ path: ".env.local" });

/**
 * Étape 2 : Envoyer les chunks vers Pinecone
 */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ingestToPinecone(chunks: Document[]) {
  console.log("🔌 Connexion à Pinecone...");

  const embedding_model_provider = process.env.EMBEDDING_MODEL_PROVIDER!

  if (!["HUGGINGFACE", "OPENROUTER"].includes(embedding_model_provider)) {
    throw new Error("The EMBEDDING_MODEL_PROVIDER variable  must be OPENROUTER or HUGGINGFACE")
  }

  // Le "!" indique à TypeScript que nous sommes sûrs que la variable d'environnement existe
  const pc = new Pinecone({ apiKey: process.env.VECTOR_DATABASE_API_KEY!});
  const index = pc.index({name: process.env.VECTOR_DATABASE_INDEX_NAME!}); //dimension: 1024

  const embeddingModelParameters = embedding_model_provider === "huggingFace" ? 
    {
      baseUrl: process.env.HF_EMBEDDING_BASE_URL!,
      model: process.env.HF_EMBEDDING_MODEL,
      openAIApiKey: process.env.HF_API_KEY!
    } : 
    {
      baseUrl: process.env.OR_EMBEDDING_BASE_URL!,
      model: process.env.OR_EMBEDDING_MODEL,
      openAIApiKey: process.env.OR_EMBEDDING_API_KEY!
    }

  console.log("🧠 Initialisation du modèle d'Embeddings OpenAI...");
  const embeddings = new OpenAIEmbeddings({
    configuration:{
      baseURL: embeddingModelParameters.baseUrl!
    },
    model: embeddingModelParameters.model!,
    openAIApiKey: embeddingModelParameters.openAIApiKey!
  });

  console.log("🚀 Génération des vecteurs et insertion dans Pinecone...");

  for (const chunk of chunks) {
    await PineconeStore.fromDocuments([chunk], embeddings, {
      pineconeIndex: index,
    });
    console.log("Ingestion d'un chunk");
    await sleep(2500);
  }

  console.log("✅ Ingestion terminée avec succès ! La base vectorielle est à jour.");
}