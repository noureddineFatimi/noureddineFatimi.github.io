import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveGithubUrl } from "../github/urlResolver";
import { fetchFromGithub } from "../github/client";
import { 
  extractRepoMetadata, 
  extractRepoCommits, 
  extractRepoLanguages 
} from "../github/parsers";
import { requireEnv } from "../utils";
import { redis } from "../redis";

export const analyzeGithubRepoTool = new DynamicStructuredTool({
  name: "analyser_metadonnees_repo",
  description: "Récupère les informations générales, les 5 derniers commits, et/ou les langages de programmation pour un dépôt spécifique. Précisez les actions souhaitées.",
  
  // Le Schéma Zod : On force le LLM à fournir un nom de repo ET un tableau d'actions valides
  schema: z.object({
    repoName: z.string().min(1, "Le nom du dépôt ne peut pas être vide.").describe("Le nom exact du dépôt GitHub (ex: mon-projet)"),
    actions: z.array(z.enum(["info", "commits", "languages"]))
      .min(1)
      .describe("La liste des données à récupérer. Choisissez parmi : 'info', 'commits', 'languages'."),
  }),

  func: async ({ repoName, actions }) => {
    try {
      // Objet qui contiendra les réponses formatées pour le LLM
      const results: Record<string, any> = {};
      
      // Tableau pour stocker nos promesses d'appels API
      const promises: Promise<void>[] = [];

      const cacheKey = `${requireEnv("GITHUB_REPO_METADATA_CACHE_KEY_PREFIX")}_${repoName}`;

      const cachedData = await redis.get<Record<string, any>>(cacheKey);

      // 1. Action: Infos générales
      if (actions.includes("info")) {
        const promise = (async () => {
          const url = resolveGithubUrl("repo_info", { repoName });
          if (cachedData && cachedData.info) {
            console.log("Données mises en cache trouvées pour les infos de depot courant");
            results.info = cachedData.info
            return
          }
          const rawData = await fetchFromGithub(url);
          results.info = extractRepoMetadata(rawData);
          const combinedData: Record<string, any> = {...(cachedData ?? {}), info: results.info}
          await redis.set(cacheKey, JSON.stringify(combinedData), { ex: Number(requireEnv("GITHUB_CACHE_TTL")) });
        })();
        promises.push(promise);
      }

      // 2. Action: Commits
      if (actions.includes("commits")) {
        const promise = (async () => {
          const url = resolveGithubUrl("repo_commits", { repoName });
          if (cachedData?.commits) {
            results.commits = cachedData.commits;
            console.log("Données mises en cache trouvées pour les commits de depot courant");
            return;
          }
          const rawData = await fetchFromGithub(url);
          results.commits = extractRepoCommits(rawData);
          const combinedData: Record<string, any> = {...(cachedData ?? {}),commits: results.commits,};
          await redis.set(cacheKey, JSON.stringify(combinedData), { ex: Number(requireEnv("GITHUB_CACHE_TTL")) })
        })();
        promises.push(promise);
      }

      // 3. Action: Langages
      if (actions.includes("languages")) {
        const promise = (async () => {
          const url = resolveGithubUrl("repo_languages", { repoName });
          if (cachedData?.languages) {
            console.log("Données mises en cache trouvées pour les languages de depot courant");
            results.languages = cachedData.languages;
            return;
          }
          const rawData = await fetchFromGithub(url);
          results.languages = extractRepoLanguages(rawData);
          const combinedData: Record<string, any> = {...(cachedData ?? {}),languages: results.languages,};
          await redis.set(cacheKey,JSON.stringify(combinedData),{ ex: Number(requireEnv("GITHUB_CACHE_TTL")) });
        })();
        promises.push(promise);
      }

      // 🚀 EXÉCUTION EN PARALLÈLE
      // On lance toutes les requêtes en même temps et on attend qu'elles soient toutes finies.
      // Si l'agent demande les 3 actions, cela prendra le temps de la requête la plus longue,
      // et non la somme des trois. Un gain de performance énorme sur Vercel !
      await Promise.all(promises);

      // On renvoie l'objet consolidé sous forme de texte au LLM
      return JSON.stringify(results, null, 2);

    } catch (error) {
      console.error(`Erreur dans l'outil analyser_metadonnees_repo pour ${repoName}:`, error);
      return JSON.stringify({ 
        error: `Impossible de récupérer les métadonnées pour le dépôt ${repoName}. Vérifiez son nom.` 
      });
    }
  },
});