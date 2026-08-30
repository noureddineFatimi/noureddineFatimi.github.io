import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "@langchain/classic/tools/retriever";
import { embeddingModelParameters } from "../embeddings/embeddingModel";

export async function getRetrieverTool() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index({name: process.env.PINECONE_INDEX_NAME!});

  console.log("🧠 Initialisation du modèle d'Embeddings OpenAI...");
  const embeddings = new OpenAIEmbeddings({
    configuration:{
      baseURL: embeddingModelParameters.baseUrl!
    },
    model: embeddingModelParameters.model!,
    openAIApiKey: embeddingModelParameters.openAIApiKey!
  });

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });

  const retriever = vectorStore.asRetriever({ k: 3 }); // k=3 : récupère les 3 chunks les plus pertinents

  return createRetrieverTool(retriever, {
    name: "recherche_cv_portfolio",
    description:
      "Utilise cet outil pour chercher des informations sur les compétences, les expériences, les diplômes ou la bio de l'ingénieur (toi).",
  });
}