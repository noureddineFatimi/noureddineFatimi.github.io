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

export async function ingestToPinecone(chunks: Document[], provider: string) {
  console.log("🔌 Connexion à Pinecone...");

  if (!["huggingFace", "openRouter"].includes(provider)) {
    throw new Error("provider !parameter must be openRouter or huggingFace")
  }

  // Le "!" indique à TypeScript que nous sommes sûrs que la variable d'environnement existe
  const pc = new Pinecone({ apiKey: process.env.VECTOR_DATABASE_API_KEY!});
  const index = pc.index(process.env.VECTOR_DATABASE_INDEX_NAME!); //dimension: 1024

  const embeddingParameters = {
    baseUrl: provider === "huggingFace" ? process.env.HF_EMBEDDING_BASE_URL! : process.env.OR_EMBEDDING_BASE_URL!,
    model: provider === "huggingFace" ? process.env.HF_EMBEDDING_MODEL! : process.env.OR_EMBEDDING_MODEL!,
    openAIApiKey: provider === "huggingFace" ? process.env.HF_API_KEY! : process.env.OR_EMBEDDING_API_KEY!
  }

  console.log("🧠 Initialisation du modèle d'Embeddings OpenAI...");
  const embeddings = new OpenAIEmbeddings({
    configuration:{
      baseURL: embeddingParameters.baseUrl!
    },
    model: embeddingParameters.model!,
    openAIApiKey: embeddingParameters.openAIApiKey!
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