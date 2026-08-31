import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { FileContentResult, MinimalRepo, RepoCommit, RepoLanguages, RepoMetadata, RepoTree } from "./types";


const MAX_FILE_LENGTH: number = Number(process.env.READING_GITHUB_FILE_MAX_FILE_LENGTH)

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
  return rawRepos?.map((repo: any) => ({
    id: repo?.id,
    name: repo?.name,
    full_name: repo?.full_name,
    private: repo?.private,
  }));
}

/**
 * Extrait les métadonnées globales d'un dépôt.
 */
export function extractRepoMetadata(rawData: any): RepoMetadata | { error: string } {
  if (rawData && rawData.error) return { error: rawData.error };

  return {
    id: rawData?.id,
    name: rawData?.name,
    full_name: rawData?.full_name,
    private: rawData?.private,
    description: rawData?.description,
    fork: rawData?.fork,
    html_url: rawData?.html_url,
    updated_at: rawData?.updated_at,
    created_at: rawData?.created_at,
    pushed_at: rawData?.pushed_at,
    size: rawData?.size,
    homepage: rawData?.homepage,
    language: rawData?.language,
    visibility: rawData?.visibility,
    default_branch: rawData?.default_branch,
    has_issues: rawData?.has_issues,
  };
}

/**
 * Extrait un tableau propre des derniers commits.
 */
export function extractRepoCommits(rawData: any): RepoCommit[] | { error: string } {
  if (rawData && rawData.error) return { error: rawData.error };
  
  if (!Array.isArray(rawData)) {
    return { error: "La réponse de l'API pour les commits n'est pas un tableau valide." };
  }

  return rawData?.map((item: any) => ({
    sha: item?.sha,
    url: item?.url,
    html_url: item?.html_url,
    commit: {
      author: {
        name: item?.commit?.author?.name,
        email: item?.commit?.author?.email,
        date: item?.commit?.author?.date,
      },
      message: item?.commit?.message,
    },
    // On doit mapper le tableau parents car il contient souvent d'autres infos inutiles
    parents: item?.parents?.map((parent: any) => ({
      sha: parent?.sha,
      url: parent?.url,
      html_url: parent?.html_url,
    })) || [],
  }));
}

/**
 * Extrait les langages (retourne l'objet tel quel car il est déjà sous forme { Langage: Bytes }).
 */
export function extractRepoLanguages(rawData: any): RepoLanguages | { error: string } {
  if (rawData && rawData.error) return { error: rawData.error };

  // L'API GitHub renvoie directement un objet propre, par exemple : { "TypeScript": 45000, "HTML": 1200 }
  // On s'assure juste que ce n'est pas un tableau ou null
  if (typeof rawData !== 'object' || Array.isArray(rawData) || rawData === null) {
    return { error: "Le format des langages renvoyé par GitHub est invalide." };
  }

  return rawData;
}

export function decodeBase64Content(encodedContent: string): string {
  // 3. Décodage du Base64 (Spécifique à Node.js / Next.js backend)
  // On enlève les retours à la ligne (\n) que GitHub ajoute parfois dans sa chaîne base64
  const cleanBase64 = encodedContent?.replace(/\n/g, "");
  const decodedString = Buffer.from(cleanBase64, "base64").toString("utf-8");

  return decodedString
}

export function extractFileContent(rawData: any, requestedPath: string): FileContentResult | { error: string } {
  // 1. Gestion des erreurs HTTP (ex: 404 si le fichier n'existe pas)
  if (rawData && rawData.error) {
    return { error: `Fichier '${requestedPath}' introuvable ou inaccessible. Détail: ${rawData.error}` };
  }

  // 2. Vérification du format
  // L'API GitHub peut renvoyer un tableau si le chemin pointe vers un DOSSIER et non un fichier.
  if (Array.isArray(rawData)) {
    return { error: `Le chemin '${requestedPath}' pointe vers un dossier, pas vers un fichier.` };
  }

  // GitHub utilise l'encodage "base64" pour les fichiers
  if (rawData?.encoding !== "base64" || typeof rawData?.content !== "string") {
    return { error: `Le format du fichier '${requestedPath}' n'est pas supporté (non-base64) ou son contenu est null.` };
  }

  try {
    const decodedString = rawData && rawData.content ? decodeBase64Content(rawData.content) : "";

    // 4. Troncature de sécurité (Protection du LLM)
    let finalContent = decodedString;
    let isTruncated = false;

    if (decodedString && decodedString.length > MAX_FILE_LENGTH) {
      finalContent = decodedString.substring(0, MAX_FILE_LENGTH) + "\n\n... [CONTENU TRONQUÉ CAR TROP LONG] ...";
      isTruncated = true;
    }

    return {
      path: rawData?.path || requestedPath,
      url: rawData?.url,
      html_url: rawData?.html_url,
      content: finalContent,
      truncated: isTruncated,
    };

  } catch (error) {
    return { error: `Échec du décodage pour le fichier '${requestedPath}'.` };
  }
}

/**
 * Extrait l'arborescence d'un dépôt (fichiers et dossiers).
 */
export function extractRepoTree(rawData: any): RepoTree | { error: string } {
  // Gestion d'erreur (ex: repo introuvable ou branche 'main' inexistante)
  if (rawData && rawData.error) return { error: rawData.error };
  
  if (!rawData?.tree || !Array.isArray(rawData?.tree)) {
    return { error: "Impossible de lire l'arborescence. La branche 'main' n'existe peut-être pas sur ce dépôt." };
  }

  return {
    sha: rawData?.sha,
    url: rawData?.url,
    // On boucle sur l'arbre pour extraire uniquement path, type et size
    tree: rawData?.tree?.map((item: any) => ({
      path: item?.path,
      type: item?.type,
      size: item?.size, // Sera undefined pour les dossiers, ce qui est normal
    })) || []
  };
}