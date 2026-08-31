import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GithubAction, GithubResolverParams } from "./types";




/**
 * Génère l'URL correcte pour l'API GitHub en fonction de l'action demandée.
 */
export function resolveGithubUrl(action: GithubAction, params?: GithubResolverParams): string {
  const baseUrl = process.env.GITHUB_API_BASE_URL;
  const owner = process.env.GITHUB_USERNAME;
  let main_branch = process.env.MAIN_GITHUB_REPOSITORIES_BRANCH || "main"; // Valeur par défaut si la variable d'environnement est absente
  main_branch = main_branch.trim() || "main"; // Si la variable est vide ou ne contient que des espaces, on utilise "main"

  // L'action list_repos peut utiliser le token global (/user/repos), 
  // mais pour cibler spécifiquement tes dépôts publics/privés, utiliser l'owner est plus robuste.
  if (!owner) {
    throw new Error("Erreur Critique : GITHUB_USERNAME n'est pas défini dans les variables d'environnement.");
  }

  switch (action) {
    case "list_repos":
      // On ajoute sort=updated pour avoir tes projets les plus récents en premier
      // et per_page=100 pour s'assurer d'avoir une bonne liste en un seul appel
      return `${baseUrl}/users/${owner}/repos?sort=updated&per_page=100`;

    case "repo_info":
      if (!params?.repoName) throw new Error("Le paramètre 'repoName' est requis pour 'repo_info'.");
      return `${baseUrl}/repos/${owner}/${params.repoName}`;

    case "repo_commits":
      if (!params?.repoName) throw new Error("Le paramètre 'repoName' est requis pour 'repo_commits'.");
      // On limite directement à 5 commits via les paramètres de l'URL pour alléger la requête
      return `${baseUrl}/repos/${owner}/${params.repoName}/commits?per_page=5`;

    case "repo_languages":
      if (!params?.repoName) throw new Error("Le paramètre 'repoName' est requis pour 'repo_languages'.");
      return `${baseUrl}/repos/${owner}/${params.repoName}/languages`;

    case "file_content":
      if (!params?.repoName) throw new Error("Le paramètre 'repoName' est requis pour 'file_content'.");
      if (!params?.filePath) throw new Error("Le paramètre 'filePath' est requis pour 'file_content'.");
      const encodedPath = params.filePath.split("/").map(encodeURIComponent).join("/");
      return `${baseUrl}/repos/${owner}/${params.repoName}/contents/${encodedPath}`;

    case "repo_tree":
      if (!params?.repoName) throw new Error("Le paramètre 'repoName' est requis pour 'repo_tree'.");
      // recursive=true permet de récupérer tous les sous-dossiers d'un coup
      return `${baseUrl}/repos/${owner}/${params.repoName}/git/trees/${main_branch}?recursive=true`;

    default:
      // Sécurité TypeScript (cette ligne ne devrait jamais être atteinte si les types sont respectés)
      throw new Error(`Action GitHub non reconnue : ${action}`);
  }
}