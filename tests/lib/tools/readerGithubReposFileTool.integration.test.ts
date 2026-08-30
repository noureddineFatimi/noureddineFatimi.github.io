import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readGithubFilesTool } from "../../../lib/tools/readerGithubReposFileTool";

describe("readGithubFilesTool - intégration", () => {
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

  it("lit plusieurs fichiers d'un dépôt avec le flux complet du tool", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("README.md")) {
        return {
          ok: true,
          json: async () => ({
            path: "README.md",
            encoding: "base64",
            content: Buffer.from("# Portfolio\n\nBienvenue").toString("base64"),
            url: "https://api.github.com/repos/octocat/portfolio/contents/README.md",
            html_url: "https://github.com/octocat/portfolio/blob/main/README.md",
          }),
        };
      }

      if (url.includes("package.json")) {
        return {
          ok: true,
          json: async () => ({
            path: "package.json",
            encoding: "base64",
            content: Buffer.from('{"name":"portfolio"}').toString("base64"),
            url: "https://api.github.com/repos/octocat/portfolio/contents/package.json",
            html_url: "https://github.com/octocat/portfolio/blob/main/package.json",
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

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["README.md", "package.json"],
    });

    const parsed = JSON.parse(result as string);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      path: "README.md",
      content: "# Portfolio\n\nBienvenue",
      truncated: false,
    });
    expect(parsed[1]).toMatchObject({
      path: "package.json",
      content: '{"name":"portfolio"}',
      truncated: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/portfolio/contents/README.md",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/portfolio/contents/package.json",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fake-token",
        }),
      }),
    );
  });

  it("retourne un message d'erreur quand un fichier demandé est un dossier", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            path: "src",
            type: "dir",
          },
        ],
      }),
    );

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["src"],
    });

    const parsed = JSON.parse(result as string);

    expect(parsed[0]).toMatchObject({
      error: "Le chemin 'src' pointe vers un dossier, pas vers un fichier.",
    });
  });

  it("valide le schéma Zod et rejette un tableau vide", async () => {
    await expect(
      readGithubFilesTool.invoke({
        repoName: "portfolio",
        filePaths: [],
      }),
    ).rejects.toThrow();
  });

  it("ne fait pas planter le flux si un fichier est invalide ou absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["README.md", "missing-file.ts"],
    });

    const parsed = JSON.parse(result as string);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      error: "Fichier 'README.md' introuvable ou inaccessible. Détail: Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier.",
    });
    expect(parsed[1]).toMatchObject({
      error: "Fichier 'missing-file.ts' introuvable ou inaccessible. Détail: Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier.",
    });
  });
});
