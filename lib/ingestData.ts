import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";
import {pdfChunking} from "./chunking"

// Charge les variables d'environnement de Next.js
dotenv.config({ path: ".env.local" });

/**
 * Étape 2 : Envoyer les chunks vers Pinecone
 */
async function ingestToPinecone(chunks: Document[]) {
  console.log("🔌 Connexion à Pinecone...");
  
  // Le "!" indique à TypeScript que nous sommes sûrs que la variable d'environnement existe
  const pc = new Pinecone({ apiKey: process.env.VECTOR_DATABASE_API_KEY! });
  const index = pc.index({name: process.env.VECTOR_DATABASE_INDEX_NAME!});

  console.log("🧠 Initialisation du modèle d'Embeddings OpenAI...");
  const embeddings = new OpenAIEmbeddings({
    configuration:{
      baseURL: process.env.EMBEDDING_BASE_URL!
    },
    modelName: process.env.EMBEDDING_MODEL!,
    apiKey: process.env.EMBEDDING_MODEL_API_KEY!
  });

  console.log("🚀 Génération des vecteurs et insertion dans Pinecone...");

  console.log("📄 Premier chunk :", chunks[0]);

  await PineconeStore.fromDocuments(chunks, embeddings, {
    pineconeIndex: index,
    maxConcurrency: 5, // Évite de surcharger l'API OpenAI
  });

  console.log("✅ Ingestion terminée avec succès ! La base vectorielle est à jour.");
}

/**
 * Fonction Principale (Main)
 */
async function main() {
  try {
    // Assure-toi que le chemin correspond bien à l'emplacement de ton CV
    const chunks = await pdfChunking("doc/CV_NOUREDDINE_ELFATIMI.pdf");
    
    // Si tu veux vérifier les chunks avant d'ingérer, décommente la ligne suivante :
    // console.log(chunks); return;

    await ingestToPinecone(chunks);
  } catch (error) {
    console.error("❌ Erreur critique lors de l'exécution :", error);
  }
}

// Lancement du script
main();