import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listGithubReposTool } from "../../../lib/tools/listeGithubReposTool";

describe("listGithubReposTool - intégration", () => {
  beforeEach(() => {
    vi.stubEnv("GITHUB_USERNAME", "octocat");
    vi.stubEnv("GITHUB_PERSONAL_ACCESS_TOKEN", "fake-token");
    vi.stubEnv("GITHUB_API_BASE_URL", "https://api.github.com");
    vi.stubEnv("READING_GITHUB_FILE_MAX_FILE_LENGTH", "1000000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("récupère et parse la liste des dépôts via le vrai flux du tool", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "portfolio",
          full_name: "octocat/portfolio",
          private: false,
          description: "Projet de portfolio",
        },
        {
          id: 2,
          name: "agent",
          full_name: "octocat/agent",
          private: true,
          description: "Agent IA",
        },
      ],
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await listGithubReposTool.invoke({});
    const parsed = JSON.parse(result as string);

    expect(parsed).toEqual([
      {
        id: 1,
        name: "portfolio",
        full_name: "octocat/portfolio",
        private: false,
      },
      {
        id: 2,
        name: "agent",
        full_name: "octocat/agent",
        private: true,
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/users/octocat/repos?sort=updated&per_page=100",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
      }),
    );
  });

  it("retourne une erreur structurée si GitHub répond avec un payload invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "bad gateway" }),
      }),
    );

    const result = await listGithubReposTool.invoke({});
    const parsed = JSON.parse(result as string);

    expect(parsed).toEqual({
      error: "La réponse de l'API GitHub n'est pas une liste valide de dépôts.",
    });
  });
});
