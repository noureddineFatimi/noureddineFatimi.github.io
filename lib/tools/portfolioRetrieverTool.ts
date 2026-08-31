import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
// l'import de dotenv.config() est nécessaire pour que les variables d'environnement soient disponibles si on lance ce fichier seulement par npx tsx - meme si que peut s'importer les varaiables d'environnement du fichier .env.local automatiquement - mais cest mieux de le faire explicitement, et dans le cas du lancement du projet entier par next, les variables d'environnement sont importées automatiquement par next, donc pas besoin de le faire explicitement dans ce cas.
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "@langchain/classic/tools/retriever";
import { embeddingModelParameters } from "../embeddings/embeddingModel";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function getRetrieverTool() {
  const pineconeApiKey = requireEnv("VECTOR_DATABASE_API_KEY");
  const pineconeIndexName = requireEnv("VECTOR_DATABASE_INDEX_NAME");
  const pc = new Pinecone({ apiKey: pineconeApiKey });
  const index = pc.index({ name: pineconeIndexName });

  console.log(" Initialisation du modèle d'Embeddings OpenAI...");
  const embeddings = new OpenAIEmbeddings({
    configuration: {
      baseURL: embeddingModelParameters.baseUrl,
    },
    model: embeddingModelParameters.model,
    openAIApiKey: embeddingModelParameters.openAIApiKey,
  });

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });

  const retriever = vectorStore.asRetriever({ k: 3 });

  return createRetrieverTool(retriever, {
    name: "recherche_cv_portfolio",
    description:
      "Utilise cet outil pour chercher des informations sur les compétences, les expériences, les diplômes ou la bio de l'ingénieur (toi).",
  });
}