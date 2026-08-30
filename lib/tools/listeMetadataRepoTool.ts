import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveGithubUrl } from "../github/urlResolver";
import { fetchFromGithub } from "../github/client";
import { 
  extractRepoMetadata, 
  extractRepoCommits, 
  extractRepoLanguages 
} from "../github/parsers";

export const analyzeGithubRepoTool = new DynamicStructuredTool({
  name: "analyser_metadonnees_repo",
  description: "Récupère les informations générales, les 5 derniers commits, et/ou les langages de programmation pour un dépôt spécifique. Précisez les actions souhaitées.",
  
  // Le Schéma Zod : On force le LLM à fournir un nom de repo ET un tableau d'actions valides
  schema: z.object({
    repoName: z.string().describe("Le nom exact du dépôt GitHub (ex: mon-projet)"),
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

      // 1. Action: Infos générales
      if (actions.includes("info")) {
        const promise = (async () => {
          const url = resolveGithubUrl("repo_info", { repoName });
          const rawData = await fetchFromGithub(url);
          results.info = extractRepoMetadata(rawData);
        })();
        promises.push(promise);
      }

      // 2. Action: Commits
      if (actions.includes("commits")) {
        const promise = (async () => {
          const url = resolveGithubUrl("repo_commits", { repoName });
          const rawData = await fetchFromGithub(url);
          results.commits = extractRepoCommits(rawData);
        })();
        promises.push(promise);
      }

      // 3. Action: Langages
      if (actions.includes("languages")) {
        const promise = (async () => {
          const url = resolveGithubUrl("repo_languages", { repoName });
          const rawData = await fetchFromGithub(url);
          results.languages = extractRepoLanguages(rawData);
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