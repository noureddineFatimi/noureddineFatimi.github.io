import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveGithubUrl } from "../github/urlResolver";
import { fetchFromGithub } from "../github/client";
import { extractFileContent } from "../github/parsers";

export const readGithubFilesTool = new DynamicStructuredTool({
  name: "lire_fichiers_repo",
  description: "Permet de lire le contenu brut de plusieurs fichiers spécifiques (comme le README.md, package.json ou du code source) dans un dépôt GitHub. À utiliser quand on te demande comment une fonctionnalité est codée ou ce que fait le projet.",
  
  // Le Schéma Zod : Exige un repo et un tableau de chemins, limité à 5 fichiers max
  schema: z.object({
    repoName: z.string().describe("Le nom exact du dépôt GitHub (ex: portfolio-next)"),
    filePaths: z.array(z.string())
      .min(1) //ici que le test de await expect(readGithubFilesTool.invoke({ repoName: "portfolio", filePaths: [] })).rejects.toThrow() passe car on a mis .min(1) pour exiger au moins un fichier et qu'on a pas catcher l'erreur dans le code de l'outil puisque on a le try/catch est sur la fonction execute et pas sur chaque fichier, donc si le tableau est vide, on ne rentre pas dans la boucle et on ne catch pas l'erreur, donc on throw l'erreur de zod qui dit que le tableau doit contenir au moins 1 élément.
      .max(5)
      .describe("Tableau contenant les chemins exacts des fichiers à lire (ex: ['README.md', 'src/app/page.tsx'])"),
  }),

  func: async ({ repoName, filePaths }) => {
    try {
      // 🚀 EXÉCUTION EN PARALLÈLE
      // On transforme notre tableau de chemins (strings) en un tableau de Promesses
      const filePromises = filePaths.map(async (filePath) => {
        try {
          const url = resolveGithubUrl("file_content", { repoName, filePath });
          const rawData = await fetchFromGithub(url);
          
          // Utilisation de notre parseur avec décodage Base64 et troncature
          return extractFileContent(rawData, filePath);
        } catch (err) {
          // Si un fichier échoue (ex: chemin invalide), on ne fait pas crasher les autres
          return { error: `Échec de la récupération pour le fichier '${filePath}'` };
        }
      });

      // On attend que tous les fichiers soient téléchargés et décodés en même temps
      const results = await Promise.all(filePromises);

      // On renvoie le tableau de résultats au LLM sous forme de JSON
      return JSON.stringify(results, null, 2);

    } catch (error) {
      console.error(`Erreur globale dans l'outil lire_fichiers_repo pour ${repoName}:`, error);
      return JSON.stringify({ 
        error: `Impossible d'accéder aux fichiers du dépôt ${repoName}.` 
      });
    }
  },
});