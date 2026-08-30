import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resolveGithubUrl } from "../github/urlResolver";
import { fetchFromGithub } from "../github/client";
import { extractMinimalRepos } from "../github/parsers";

export const listGithubReposTool = new DynamicStructuredTool({
  name: "lister_depots_github",
  description: "Retourne la liste complète des dépôts GitHub du portfolio avec leurs noms exacts. À utiliser pour connaître les projets disponibles avant de chercher des informations spécifiques sur un projet.",
  
  // Schéma vide car le LLM n'a pas besoin de deviner de paramètres pour lister tes dépôts
  schema: z.object({}), 
  
  func: async () => {
    try {
      // 1. Résolution de l'URL via notre fabrique
      const url = resolveGithubUrl("list_repos");
      
      // 2. Appel HTTP sécurisé via notre wrapper
      const rawData = await fetchFromGithub(url);
      
      // 3. Extraction des données utiles via notre parser
      const parsedRepos = extractMinimalRepos(rawData);

      // Si le parser (ou le client) a intercepté une erreur, on la renvoie au LLM
      // On utilise JSON.stringify car LangChain s'attend à ce qu'un outil retourne une string
      if ('error' in parsedRepos) {
        return JSON.stringify(parsedRepos);
      }

      // Si tout va bien, on convertit notre tableau épuré en chaîne de caractères pour le LLM
      return JSON.stringify(parsedRepos, null, 2);

    } catch (error) {
      // Sécurité ultime : si une exception imprévue se produit (ex: le resolver échoue)
      // On renvoie un message texte pour ne pas faire crasher l'agent
      return JSON.stringify({ error: "Une erreur inattendue est survenue lors de la récupération des dépôts." });
    }
  },
});