import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";

export async function pdfChunking(path: string) : Promise<Document<Record<string, any>>[]> {
  console.log("📄 Chargement du PDF...");
  
  // Remplace par le chemin exact vers ton fichier CV
  const loader: PDFLoader = new PDFLoader(path); 
  const docs: Document<Record<string, any>>[] = await loader.load();
  
  // Le PDFLoader renvoie souvent une page = un document. On fusionne tout en un seul texte brut.
  const fullText: string = docs.map(doc => doc.pageContent).join("\n");

  console.log("✂️ Découpage en sections (Chunking sémantique)...");
  // ⚠️ TRÈS IMPORTANT : Adapte cette liste avec les titres EXACTS qui apparaissent dans ton CV.
  // Par exemple, si tu as écrit "Parcours Scolaire" au lieu de "Formation", ajoute-le ici.
  const headers: string[] = [
    "PROFIL\n", "FORMATION\n", "EXPÉRIENCE PROFESSIONNELLE\n", "PROJETS ACADÉMIQUES\n",
    "COMPÉTENCES\n", "CERTIFICATIONS PROFESSIONNELLES\n","ACTIVITÉS EXTRASCOLAIRES\n", "LANGUES\n"
  ];

  // On crée une expression régulière dynamique pour couper le texte à chaque fois qu'un de ces mots est trouvé
  const regex: RegExp = new RegExp(`(${headers.join('|')})`, 'i'); // 'i' pour ignorer la casse
  
  // La fonction split avec une regex capturante renvoie un tableau : [TexteAvant, TitreTrouvé, TexteAprès, TitreTrouvé, ...]
  const parts: string[] = fullText.split(regex);
  const chunks: Document<Record<string, any>>[] = [];

  // La première partie (parts[0]) contient souvent ton Nom, Prénom, Email et Liens avant le premier grand titre
  if (parts[0].trim()) {
    chunks.push(new Document({
      pageContent: parts[0].trim(),
      metadata: { category: "en-tete_contact" }
    }));
  }

  // On boucle pour associer chaque Titre (parts[1], parts[3]...) à son Contenu (parts[2], parts[4]...)
  for (let i:number = 1; i < parts.length; i += 2) {
    const sectionTitle:string = parts[i].toUpperCase();
    const sectionContent:string = parts[i + 1] ? parts[i + 1].trim() : "";

    if (sectionContent) {
      chunks.push(new Document({
        // On réintègre le titre dans le contenu pour que l'IA sache de quoi on parle
        pageContent: `${sectionTitle}\n${sectionContent}`,
        metadata: { category: sectionTitle.toLowerCase() }
      }));
    }
  }

  console.log("\n✅ Voici les Chunks générés :\n");
  
  chunks.forEach((chunk: Document<Record<string, any>>, index: number) => {
    console.log(`\n==================================================`);
    console.log(`📌 CHUNK ${index + 1} | Catégorie (Metadata): ${chunk.metadata.category}`);
    console.log(`==================================================`);
    // On affiche le contenu complet du chunk pour que tu puisses bien vérifier
    console.log(chunk.pageContent); 
  });

  return chunks
}