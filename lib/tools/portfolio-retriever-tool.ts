import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "@langchain/classic/tools/retriever";

export async function getRetrieverTool() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index(process.env.PINECONE_INDEX_NAME!);

  // ⚠️ Remplace ceci par la configuration exacte que tu as utilisée pour ton ingestion !
  const embeddings = new OpenAIEmbeddings({
    modelName: "nom-de-ton-modele-embedding", // ex: si tu as utilisé un modèle HF compatible
    configuration: {
      baseURL: process.env.EMBEDDINGS_BASE_URL, // ex: URL HuggingFace ou autre
    }
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