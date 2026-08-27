export async function fetchFromGithub(url: string) {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error("Erreur critique : GITHUB_PERSONAL_ACCESS_TOKEN est manquant.");
  }

  try {
    const response = await fetch(url, {
      // Configuration des headers obligatoires de GitHub
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28", // Fixer la version est une bonne pratique
      },
      // Pas de cache agressif de Next.js car on veut des données en temps réel
      cache: "no-store", 
    });

    // Gestion gracieuse des erreurs pour éviter de faire crasher l'Agent
    if (!response.ok) {
      if (response.status === 404) {
        return { error: "Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier." };
      }
      if (response.status === 403) {
        return { error: "Limite de requêtes GitHub atteinte (403). Veuillez réessayer plus tard." };
      }
      return { error: `Erreur API GitHub HTTP ${response.status}: ${response.statusText}` };
    }

    // Si tout va bien, on parse le JSON
    const data = await response.json();
    return data;

  } catch (error) {
    // Intercepte les erreurs réseau (ex: pas de connexion)
    console.error("Erreur réseau lors de l'appel GitHub :", error);
    return { error: "Échec de la connexion à l'API GitHub." };
  }
}