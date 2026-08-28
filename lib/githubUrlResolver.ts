import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Définition stricte des actions possibles (autocomplétion et sécurité)
export type GithubAction = 
  | "list_repos" 
  | "repo_info" 
  | "repo_commits" 
  | "repo_languages" 
  | "file_content"
  | "repo_tree";

// Définition des paramètres optionnels selon l'action
export interface GithubResolverParams {
  repoName?: string;
  filePath?: string;
}

/**
 * Génère l'URL correcte pour l'API GitHub en fonction de l'action demandée.
 */
export function resolveGithubUrl(action: GithubAction, params?: GithubResolverParams): string {
  const baseUrl = "https://api.github.com";
  const owner = process.env.GITHUB_USERNAME;
  const main_branch = process.env.MAIN_GITHUB_REPOSITORIES_BRANCH;

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
      return `${baseUrl}/repos/${owner}/${params.repoName}/contents/${params.filePath}`;

    case "repo_tree":
      if (!params?.repoName) throw new Error("Le paramètre 'repoName' est requis pour 'repo_tree'.");
      // recursive=true permet de récupérer tous les sous-dossiers d'un coup
      return `${baseUrl}/repos/${owner}/${params.repoName}/git/trees/${main_branch}?recursive=true`;

    default:
      // Sécurité TypeScript (cette ligne ne devrait jamais être atteinte si les types sont respectés)
      throw new Error(`Action GitHub non reconnue : ${action}`);
  }
}

function testResolveGithubUrl() {
  // Test de l'URL pour lister les dépôts
  const listReposResult = resolveGithubUrl("list_repos")
  const expected = `https://api.github.com/users/${process.env.GITHUB_USERNAME}/repos?sort=updated&per_page=100`;
  console.assert(listReposResult === expected, `Test échoué pour list_repos. Résultat: ${listReposResult}, Attendu: ${expected}`);

  // Test de l'URL pour obtenir les informations d'un dépôt
  const repoInfoResult = resolveGithubUrl("repo_info", { repoName: "mon-depot" });
  const expectedRepoInfo = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/mon-depot`       ;
  console.assert(repoInfoResult === expectedRepoInfo, `Test échoué pour repo_info. Résultat: ${repoInfoResult}, Attendu: ${expectedRepoInfo}`);

  // Test de l'URL pour obtenir les commits d'un dépôt
  const repoCommitsResult = resolveGithubUrl("repo_commits", { repoName: "mon-depot" });
  const expectedRepoCommits = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/mon-depot/commits?per_page=5`;
  console.assert(repoCommitsResult === expectedRepoCommits, `Test échoué pour repo_commits. Résultat: ${repoCommitsResult}, Attendu: ${expectedRepoCommits}`);

  // Test de l'URL pour obtenir les langages d'un dépôt
  const repoLanguagesResult = resolveGithubUrl("repo_languages", { repoName: "mon-depot" });
  const expectedRepoLanguages = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/mon-depot/languages`;
  console.assert(repoLanguagesResult === expectedRepoLanguages, `Test échoué pour repo_languages. Résultat: ${repoLanguagesResult}, Attendu: ${expectedRepoLanguages}`);

  // Test de l'URL pour obtenir le contenu d'un fichier dans un dépôt
  const fileContentResult = resolveGithubUrl("file_content", { repoName: "mon-depot", filePath: "chemin/vers/fichier.txt" });
  const expectedFileContent = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/mon-depot/contents/chemin/vers/fichier.txt`;
  console.assert(fileContentResult === expectedFileContent, `Test échoué pour file_content. Résultat: ${fileContentResult}, Attendu: ${expectedFileContent}`);

  console.log("Si aucun test n'a échoué, tous les tests pour resolveGithubUrl ont réussi !");
}

testResolveGithubUrl();