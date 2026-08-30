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

// On définit l'interface de ce qu'on veut garder pour avoir l'autocomplétion
export interface MinimalRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

// Typage pour les métadonnées générales du dépôt
export interface RepoMetadata {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  fork: boolean;
  html_url: string;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  size: number;
  homepage: string | null;
  language: string | null;
  visibility: string;
  default_branch: string;
  has_issues: boolean;
}

// Typage pour un Commit spécifique
export interface RepoCommit {
  sha: string;
  url: string;
  html_url: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

// Typage pour les langages (Un dictionnaire de chaînes vers des nombres)
export type RepoLanguages = Record<string, number>;

// Typage pour un élément de l'arborescence
export interface RepoTreeItem {
  path: string;
  type: string; // 'blob' = fichier, 'tree' = dossier
  size?: number; // size n'existe que pour les fichiers (blob), pas pour les dossiers
}

// Typage pour la réponse globale de l'arborescence
export interface RepoTree {
  sha: string;
  url: string;
  tree: RepoTreeItem[];
}

export interface FileContentResult {
  path: string;
  content: string;
  url: string;
  html_url: string;
  truncated: boolean; // Utile pour informer le LLM que le fichier a été coupé
}