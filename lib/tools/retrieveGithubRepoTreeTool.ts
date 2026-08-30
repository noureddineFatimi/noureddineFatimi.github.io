import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveGithubUrl } from "../github/urlResolver";
import { fetchFromGithub } from "../github/client";
import { extractRepoTree } from "../github/parsers";

export const getGithubTreeTool = new DynamicStructuredTool({
  name: "recuperer_arborescence_repo",
  description: "Retourne l'arborescence complète (fichiers et dossiers) d'un dépôt GitHub sur la branche principale (main). À utiliser systématiquement pour comprendre la structure du projet et trouver les chemins exacts des fichiers avant d'utiliser l'outil 'lire_fichiers_repo'.",
  
  schema: z.object({
    repoName: z.string().describe("Le nom exact du dépôt GitHub (ex: Atracio-Agent-v1)"),
  }),

  func: async ({ repoName }) => {
    try {
      // 1. Résolution de l'URL
      const url = resolveGithubUrl("repo_tree", { repoName });
      
      // 2. Appel HTTP
      const rawData = await fetchFromGithub(url);
      
      // 3. Extraction via le parser
      const treeData = extractRepoTree(rawData);

      // Gestion de l'erreur interceptée par le parser ou le client
      if ('error' in treeData) {
        return JSON.stringify(treeData);
      }

      // On renvoie le tout formaté pour le LLM
      return JSON.stringify(treeData, null, 2);

    } catch (error) {
      console.error(`Erreur dans l'outil recuperer_arborescence_repo pour ${repoName}:`, error);
      return JSON.stringify({ 
        error: `Impossible de récupérer l'arborescence pour le dépôt ${repoName}.` 
      });
    }
  },
});