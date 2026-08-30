import { pdfChunking } from "@/lib/ingestion/chunking";
import { ingestToPinecone } from "@/lib/ingestion/ingestData";

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