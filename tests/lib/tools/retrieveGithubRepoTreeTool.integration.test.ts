import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getGithubTreeTool } from "../../../lib/tools/retrieveGithubRepoTreeTool";

describe("getGithubTreeTool - intégration", () => {
  beforeEach(() => {
    vi.stubEnv("GITHUB_USERNAME", "octocat");
    vi.stubEnv("GITHUB_PERSONAL_ACCESS_TOKEN", "fake-token");
    vi.stubEnv("MAIN_GITHUB_REPOSITORIES_BRANCH", "main");
    vi.stubEnv("GITHUB_API_BASE_URL", "https://api.github.com");
    vi.stubEnv("READING_GITHUB_FILE_MAX_FILE_LENGTH", "1000000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("récupère l'arborescence d'un dépôt via le flux complet du tool", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sha: "abc123",
          url: "https://api.github.com/repos/octocat/portfolio/git/trees/main",
          tree: [
            { path: "README.md", type: "blob", size: 120 },
            { path: "src", type: "tree" },
            { path: "src/app", type: "tree" },
            { path: "src/app/page.tsx", type: "blob", size: 400 },
          ],
        }),
      }),
    );

    const result = await getGithubTreeTool.invoke({
      repoName: "portfolio",
    });

    const parsed = JSON.parse(result as string);

    expect(parsed).toEqual({
      sha: "abc123",
      url: "https://api.github.com/repos/octocat/portfolio/git/trees/main",
      tree: [
        { path: "README.md", type: "blob", size: 120 },
        { path: "src", type: "tree", size: undefined },
        { path: "src/app", type: "tree", size: undefined },
        { path: "src/app/page.tsx", type: "blob", size: 400 },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/portfolio/git/trees/main?recursive=true",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
        }),
      }),
    );
  });

  it("retourne une erreur structurée si l'arborescence est absente ou invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Not Found" }),
      }),
    );

    const result = await getGithubTreeTool.invoke({
      repoName: "portfolio",
    });

    const parsed = JSON.parse(result as string);

    expect(parsed).toEqual({
      error: "Impossible de lire l'arborescence. La branche 'main' n'existe peut-être pas sur ce dépôt.",
    });
  });

  it("valide le schéma Zod et rejette un repoName vide", async () => {
    await expect(
      getGithubTreeTool.invoke({
        repoName: "",
      }),
    ).rejects.toThrow();
  });
});
