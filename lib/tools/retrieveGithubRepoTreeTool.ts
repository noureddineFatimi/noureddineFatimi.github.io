import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveGithubUrl } from "../github/urlResolver";
import { fetchFromGithub } from "../github/client";
import { extractRepoTree } from "../github/parsers";
import { requireEnv } from "../utils";
import { redis } from "../redis";

export const getGithubTreeTool = new DynamicStructuredTool({
  name: "recuperer_arborescence_repo",
  description: "Retourne l'arborescence complète (fichiers et dossiers) d'un dépôt GitHub sur la branche principale (main). À utiliser systématiquement pour comprendre la structure du projet et trouver les chemins exacts des fichiers avant d'utiliser l'outil 'lire_fichiers_repo'.",
  
  schema: z.object({
    repoName: z.string().min(1, "Le nom du dépôt ne peut pas être vide.").describe("Le nom exact du dépôt GitHub (ex: Atracio-Agent-v1)"),
  }),

  func: async ({ repoName }) => {
    try {
      // 1. Résolution de l'URL
      const url = resolveGithubUrl("repo_tree", { repoName });

      const cacheKey = `${requireEnv("GITHUB_REPO_TREE_CACHE_KEY_PREFIX")}_${repoName}`;

      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        return JSON.stringify(cachedData, null, 2); //verifier que si treedata contient la cle erreur ne sauvegarder pas dans le cache
      }

      // 2. Appel HTTP
      const rawData = await fetchFromGithub(url);
      
      // 3. Extraction via le parser
      const treeData = extractRepoTree(rawData);

      // Gestion de l'erreur interceptée par le parser ou le client
      if ('error' in treeData) {
        return JSON.stringify(treeData);
      }

      const treeDataString = JSON.stringify(treeData, null, 2);

      // 4. Mise en cache des résultats pour 2 heures
      await redis.set(cacheKey, treeDataString, { ex: Number(requireEnv("GITHUB_CACHE_TTL")) });

      // On renvoie le tout formaté pour le LLM
      return treeDataString;

    } catch (error) {
      console.error(`Erreur dans l'outil recuperer_arborescence_repo pour ${repoName}:`, error);
      return JSON.stringify({ 
        error: `Impossible de récupérer l'arborescence pour le dépôt ${repoName}.` 
      });
    }
  },
});