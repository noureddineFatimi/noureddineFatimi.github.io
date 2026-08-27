// On définit l'interface de ce qu'on veut garder pour avoir l'autocomplétion
export interface MinimalRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

/**
 * Prend la réponse brute de l'API GitHub et extrait uniquement les clés essentielles.
 * @param rawRepos - Le tableau de dépôts renvoyé par l'API GitHub
 * @returns Un tableau allégé contenant uniquement id, name, full_name et private
 */
export function extractMinimalRepos(rawRepos: any): MinimalRepo[] | { error: string } {
  // Si notre githubClient a intercepté une erreur, on la retourne directement
  if (rawRepos && rawRepos.error) {
    return { error: rawRepos.error };
  }

  // Sécurité : on s'assure que la donnée reçue est bien un tableau
  if (!Array.isArray(rawRepos)) {
    return { error: "La réponse de l'API GitHub n'est pas une liste valide de dépôts." };
  }

  // La fonction map() boucle sur le tableau et crée un nouveau tableau épuré
  return rawRepos.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
  }));
}

function testExtractMinimalRepos() {
  // Cas de test avec une réponse valide de l'API GitHub
  const rawRepos = [
    { id: 1, name: "repo1", full_name: "user/repo1", private: false, extra: "data" },
    { id: 2, name: "repo2", full_name: "user/repo2", private: true, extra: "data" },
  ];
  const result = extractMinimalRepos(rawRepos);
  console.assert(Array.isArray(result), "Le résultat n'est pas un tableau.");
  Array.isArray(result) ? console.assert(result.length === 2, "Le tableau ne contient pas le bon nombre d'éléments.") : console.log("Erreur : Résultat n'est pas un tableau de MinimalRepo.");
  console.log("Test réussi pour extractMinimalRepos !");
}

testExtractMinimalRepos();