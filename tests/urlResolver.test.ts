import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveGithubUrl } from "../lib/github/urlResolver";

describe("resolveGithubUrl", () => {
  beforeEach(() => {
    process.env.GITHUB_USERNAME = "alice";
    process.env.MAIN_GITHUB_REPOSITORIES_BRANCH = "main";
  });

  afterEach(() => {
    delete process.env.GITHUB_USERNAME;
    delete process.env.MAIN_GITHUB_REPOSITORIES_BRANCH;
  });

  it("génère l’URL pour list_repos", () => {
    expect(resolveGithubUrl("list_repos")).toBe(
      "https://api.github.com/users/alice/repos?sort=updated&per_page=100",
    );
  });

  it("génère l’URL pour repo_info", () => {
    expect(resolveGithubUrl("repo_info", { repoName: "portfolio" })).toBe(
      "https://api.github.com/repos/alice/portfolio",
    );
  });

  it("génère l’URL pour repo_commits", () => {
    expect(resolveGithubUrl("repo_commits", { repoName: "portfolio" })).toBe(
      "https://api.github.com/repos/alice/portfolio/commits?per_page=5",
    );
  });

  it("génère l’URL pour repo_languages", () => {
    expect(resolveGithubUrl("repo_languages", { repoName: "portfolio" })).toBe(
      "https://api.github.com/repos/alice/portfolio/languages",
    );
  });

  it("génère l’URL pour file_content", () => {
    expect(
      resolveGithubUrl("file_content", {
        repoName: "portfolio",
        filePath: "src/app/page.tsx",
      }),
    ).toBe("https://api.github.com/repos/alice/portfolio/contents/src/app/page.tsx");
  });

  it("génère l’URL pour repo_tree", () => {
    expect(resolveGithubUrl("repo_tree", { repoName: "portfolio" })).toBe(
      "https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true",
    );
  });

  it("lève une erreur si GITHUB_USERNAME est absent", () => {
    delete process.env.GITHUB_USERNAME;

    expect(() => resolveGithubUrl("list_repos")).toThrow(
      "Erreur Critique : GITHUB_USERNAME n'est pas défini dans les variables d'environnement.",
    );
  });

  it("lève une erreur si repoName est absent pour une action nécessitant un dépôt", () => {
    expect(() => resolveGithubUrl("repo_info", {})).toThrow(
      "Le paramètre 'repoName' est requis pour 'repo_info'.",
    );
    expect(() => resolveGithubUrl("repo_commits", {})).toThrow(
      "Le paramètre 'repoName' est requis pour 'repo_commits'.",
    );
    expect(() => resolveGithubUrl("repo_languages", {})).toThrow(
      "Le paramètre 'repoName' est requis pour 'repo_languages'.",
    );
    expect(() => resolveGithubUrl("repo_tree", {})).toThrow(
      "Le paramètre 'repoName' est requis pour 'repo_tree'.",
    );
  });

  it("lève une erreur si filePath est absent pour file_content", () => {
    expect(() => resolveGithubUrl("file_content", { repoName: "portfolio" })).toThrow(
      "Le paramètre 'filePath' est requis pour 'file_content'.",
    );
  });

  it("utilise la branche main si MAIN_GITHUB_REPOSITORIES_BRANCH est absent ou invalide", () => {
    delete process.env.MAIN_GITHUB_REPOSITORIES_BRANCH;
    expect(resolveGithubUrl("repo_tree", { repoName: "portfolio" })).toBe(
      "https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true",
    );

    process.env.MAIN_GITHUB_REPOSITORIES_BRANCH = "";
    expect(resolveGithubUrl("repo_tree", { repoName: "portfolio" })).toBe(
      "https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true",
    );
  });

  it("encode les chemins contenant des caractères spéciaux", () => {
    expect(
      resolveGithubUrl("file_content", {
        repoName: "portfolio",
        filePath: "docs/Guide spécial #1/README.md",
      }),
    ).toBe(
      "https://api.github.com/repos/alice/portfolio/contents/docs/Guide%20sp%C3%A9cial%20%231/README.md",
    );
  });
});
