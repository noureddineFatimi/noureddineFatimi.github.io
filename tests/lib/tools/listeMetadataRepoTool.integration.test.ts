import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { analyzeGithubRepoTool } from "../../../lib/tools/listeMetadataRepoTool";

describe("analyzeGithubRepoTool - intégration", () => {
  beforeEach(() => {
    vi.stubEnv("GITHUB_USERNAME", "octocat");
    vi.stubEnv("GITHUB_PERSONAL_ACCESS_TOKEN", "fake-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("récupère les infos, commits et langages d'un dépôt en parallèle", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/commits?per_page=5")) {
        return {
          ok: true,
          json: async () => [
            {
              sha: "aaa111",
              url: "https://api.github.com/repos/octocat/portfolio/commits/aaa111",
              html_url: "https://github.com/octocat/portfolio/commit/aaa111",
              commit: {
                author: {
                  name: "Alice",
                  email: "alice@example.com",
                  date: "2025-01-10T00:00:00Z",
                },
                message: "Premier commit",
              },
              parents: [
                {
                  sha: "bbb222",
                  url: "https://api.github.com/repos/octocat/portfolio/commits/bbb222",
                  html_url: "https://github.com/octocat/portfolio/commit/bbb222",
                },
              ],
            },
          ],
        };
      }

      if (url.includes("/languages")) {
        return {
          ok: true,
          json: async () => ({
            TypeScript: 500,
            CSS: 200,
          }),
        };
      }

      if (url.includes("/repos/octocat/portfolio")) {
      return {
          ok: true,
          json: async () => ({
            id: 42,
            name: "portfolio",
            full_name: "octocat/portfolio",
            private: false,
            description: "Mon portfolio",
            fork: false,
            html_url: "https://github.com/octocat/portfolio",
            updated_at: "2025-01-01T00:00:00Z",
            created_at: "2024-01-01T00:00:00Z",
            pushed_at: "2025-01-15T00:00:00Z",
            size: 120,
            homepage: null,
            language: "TypeScript",
            visibility: "public",
            default_branch: "main",
            has_issues: true,
          }),
        };
    }

      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };
    });

    vi.stubGlobal("fetch", fetchMock);
    const result = await analyzeGithubRepoTool.invoke({
      repoName: "portfolio",
      actions: ["info", "commits", "languages"],
    });

    const parsed = JSON.parse(result as string);

    expect(parsed.info).toMatchObject({
      id: 42,
      name: "portfolio",
      full_name: "octocat/portfolio",
      private: false,
      language: "TypeScript",
    });

    expect(parsed.commits).toEqual([
      {
        sha: "aaa111",
        url: "https://api.github.com/repos/octocat/portfolio/commits/aaa111",
        html_url: "https://github.com/octocat/portfolio/commit/aaa111",
        commit: {
          author: {
            name: "Alice",
            email: "alice@example.com",
            date: "2025-01-10T00:00:00Z",
          },
          message: "Premier commit",
        },
        parents: [
          {
            sha: "bbb222",
            url: "https://api.github.com/repos/octocat/portfolio/commits/bbb222",
            html_url: "https://github.com/octocat/portfolio/commit/bbb222",
          },
        ],
      },
    ]);

    expect(parsed.languages).toEqual({
      TypeScript: 500,
      CSS: 200,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/portfolio",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/portfolio/commits?per_page=5",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/portfolio/languages",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
        }),
      }),
    );
  });

  it("retourne un objet vide si aucune action n'est demandée, car le schéma impose au moins 1 clé", async () => {
    await expect(
      analyzeGithubRepoTool.invoke({
        repoName: "portfolio",
        actions: [],
      }),
    ).rejects.toThrow();
  });

  it("gère proprement un repo avec erreur de réponse GitHub", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    const result = await analyzeGithubRepoTool.invoke({
      repoName: "unknown-repo",
      actions: ["info"],
    });

    const parsed = JSON.parse(result as string);

    expect(parsed.info).toMatchObject({
      error: "Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier.",
    });
  });
});
