import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import type { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { embeddingModelParameters } from "../embeddings/embeddingModel";
import crypto from "crypto";
// Charge les variables d'environnement de Next.js

/**
 * Étape 2 : Envoyer les chunks vers Pinecone
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ingestToPinecone(chunks: Document[]) {
  console.log(" Connexion à Pinecone...");

  // Le "!" indique à TypeScript que nous sommes sûrs que la variable d'environnement existe
  const pc = new Pinecone({ apiKey: requireEnv("VECTOR_DATABASE_API_KEY") });
  const index = pc.index({name: requireEnv("VECTOR_DATABASE_INDEX_NAME")}); //dimension: 1024

  console.log(" Initialisation du modèle d'Embeddings OpenAI...");
  const embeddings = new OpenAIEmbeddings({
    configuration:{
      baseURL: embeddingModelParameters.baseUrl
    },
    model: embeddingModelParameters.model,
    openAIApiKey: embeddingModelParameters.openAIApiKey
  });

  console.log(" Génération des vecteurs et insertion dans Pinecone...");
  
  for (const chunk of chunks) {
    const vectors = await embeddings.embedDocuments([chunk.pageContent]);

    const vector = vectors[0];

    if (!vector || vector.length === 0 || vector.some((value) => !Number.isFinite(value))) {
      throw new Error(
        `L'endpoint d'embedding n'a pas renvoyé un vecteur valide pour le chunk ${chunk.metadata.category}.`
      );
    }

    await index.namespace("").upsert({
      records: [{
        id: crypto.randomUUID(),
        values: vector,
        metadata: {
          ...chunk.metadata,
          text: chunk.pageContent,
        },
      }],
    });

    console.log("Ingestion d'un chunk");
    
    await sleep(2500);
  }
}

console.log(" Ingestion terminée avec succès ! La base vectorielle est à jour.")