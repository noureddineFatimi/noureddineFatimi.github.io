import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/github/urlResolver", () => ({
  resolveGithubUrl: vi.fn(),
}));

vi.mock("../../../lib/github/client", () => ({
  fetchFromGithub: vi.fn(),
}));

vi.mock("../../../lib/github/parsers", () => ({
  extractRepoMetadata: vi.fn(),
  extractRepoCommits: vi.fn(),
  extractRepoLanguages: vi.fn(),
}));

import { analyzeGithubRepoTool } from "../../../lib/tools/listeMetadataRepoTool";
import { resolveGithubUrl } from "../../../lib/github/urlResolver";
import { fetchFromGithub } from "../../../lib/github/client";
import { extractRepoMetadata, extractRepoCommits, extractRepoLanguages } from "../../../lib/github/parsers";

describe("analyzeGithubRepoTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepte les bons paramètres et refuse les invalides", async () => {
    await expect(
      analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: ["info"] }),
    ).resolves.toBeTypeOf("string");

    await expect(
      analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: ["info", "commits", "languages"] }),
    ).resolves.toBeTypeOf("string");

    await expect(
      analyzeGithubRepoTool.invoke({ repoName: "", actions: ["info"] }),
    ).rejects.toThrow();

    await expect(
      analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: [] as any }),
    ).rejects.toThrow();

    await expect(
      analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: ["unknown" as any] }),
    ).rejects.toThrow();
  });

  it("construit les URLs et appelle les bons parseurs pour une action unique", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/repos/alice/portfolio");
    vi.mocked(fetchFromGithub).mockResolvedValue({ id: 1, name: "portfolio" } as any);
    vi.mocked(extractRepoMetadata).mockReturnValue({
      id: 1,
      name: "portfolio",
      full_name: "alice/portfolio",
      private: false,
      description: null,
      fork: false,
      html_url: "https://github.com/alice/portfolio",
      updated_at: "2024-01-01T00:00:00Z",
      created_at: "2023-12-01T00:00:00Z",
      pushed_at: "2024-01-02T00:00:00Z",
      size: 10,
      homepage: null,
      language: "TypeScript",
      visibility: "public",
      default_branch: "main",
      has_issues: true,
    });

    const result = await analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: ["info"] });

    expect(resolveGithubUrl).toHaveBeenCalledTimes(1);
    expect(resolveGithubUrl).toHaveBeenCalledWith("repo_info", { repoName: "portfolio" });
    expect(fetchFromGithub).toHaveBeenCalledTimes(1);
    expect(fetchFromGithub).toHaveBeenCalledWith("https://api.github.com/repos/alice/portfolio");
    expect(extractRepoMetadata).toHaveBeenCalledTimes(1);
    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toHaveProperty("info");
  });

  it("traite trois actions simultanées en parallèle", async () => {
    vi.mocked(resolveGithubUrl)
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio")
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/commits?per_page=5")
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/languages");

    vi.mocked(fetchFromGithub)
      .mockResolvedValueOnce({ id: 1, name: "portfolio" } as any)
      .mockResolvedValueOnce([{ sha: "abc" }] as any)
      .mockResolvedValueOnce({ TypeScript: 10 } as any);

    vi.mocked(extractRepoMetadata).mockReturnValue({
      id: 1,
      name: "portfolio",
      full_name: "alice/portfolio",
      private: false,
      description: null,
      fork: false,
      html_url: "https://github.com/alice/portfolio",
      updated_at: "2024-01-01T00:00:00Z",
      created_at: "2023-12-01T00:00:00Z",
      pushed_at: "2024-01-02T00:00:00Z",
      size: 10,
      homepage: null,
      language: "TypeScript",
      visibility: "public",
      default_branch: "main",
      has_issues: true,
    });
    vi.mocked(extractRepoCommits).mockReturnValue([{ sha: "abc" }] as any);
    vi.mocked(extractRepoLanguages).mockReturnValue({ TypeScript: 10 } as any);

    const result = await analyzeGithubRepoTool.invoke({
      repoName: "portfolio",
      actions: ["info", "commits", "languages"],
    });

    expect(resolveGithubUrl).toHaveBeenCalledTimes(3);
    expect(fetchFromGithub).toHaveBeenCalledTimes(3);
    expect(extractRepoMetadata).toHaveBeenCalledTimes(1);
    expect(extractRepoCommits).toHaveBeenCalledTimes(1);
    expect(extractRepoLanguages).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("info");
    expect(parsed).toHaveProperty("commits");
    expect(parsed).toHaveProperty("languages");
  });

  it("gère un dépôt inexistant et retourne une chaîne JSON d’erreur", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/repos/alice/unknown");
    vi.mocked(fetchFromGithub).mockResolvedValue({ error: "Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier." } as any);
    vi.mocked(extractRepoMetadata).mockReturnValue({ error: "Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier." } as any);

    const result = await analyzeGithubRepoTool.invoke({ repoName: "unknown", actions: ["info"] });

    expect(JSON.parse(result)).toEqual({
      info: { error: "Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier." },
    });
  });

  it("gère correctement une action qui échoue sans faire planter les autres", async () => {
    vi.mocked(resolveGithubUrl)
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio")
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/commits?per_page=5");

    vi.mocked(fetchFromGithub)
      .mockResolvedValueOnce({ id: 1, name: "portfolio" } as any)
      .mockResolvedValueOnce({ error: "Limited" } as any);

    vi.mocked(extractRepoMetadata).mockReturnValue({
      id: 1,
      name: "portfolio",
      full_name: "alice/portfolio",
      private: false,
      description: null,
      fork: false,
      html_url: "https://github.com/alice/portfolio",
      updated_at: "2024-01-01T00:00:00Z",
      created_at: "2023-12-01T00:00:00Z",
      pushed_at: "2024-01-02T00:00:00Z",
      size: 10,
      homepage: null,
      language: "TypeScript",
      visibility: "public",
      default_branch: "main",
      has_issues: true,
    });
    vi.mocked(extractRepoCommits).mockReturnValue({ error: "Limited" } as any);

    const result = await analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: ["info", "commits"] });

    expect(JSON.parse(result)).toEqual({
      info: {
        id: 1,
        name: "portfolio",
        full_name: "alice/portfolio",
        private: false,
        description: null,
        fork: false,
        html_url: "https://github.com/alice/portfolio",
        updated_at: "2024-01-01T00:00:00Z",
        created_at: "2023-12-01T00:00:00Z",
        pushed_at: "2024-01-02T00:00:00Z",
        size: 10,
        homepage: null,
        language: "TypeScript",
        visibility: "public",
        default_branch: "main",
        has_issues: true,
      },
      commits: { error: "Limited" },
    });
  });

  it("renvoie toujours une chaîne JSON en cas d’erreur globale du tool", async () => {
    vi.mocked(resolveGithubUrl).mockImplementation(() => {
      throw new Error("boom");
    });

    const result = await analyzeGithubRepoTool.invoke({ repoName: "portfolio", actions: ["info"] });

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual({
      error: "Impossible de récupérer les métadonnées pour le dépôt portfolio. Vérifiez son nom.",
    });
  });
});
