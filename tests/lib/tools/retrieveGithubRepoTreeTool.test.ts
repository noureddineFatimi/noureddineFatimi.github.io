import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/github/urlResolver.ts", () => ({
  resolveGithubUrl: vi.fn(),
}));

vi.mock("../../../lib/github/client.ts", () => ({
  fetchFromGithub: vi.fn(),
}));

vi.mock("../../../lib/github/parsers.ts", () => ({
  extractRepoTree: vi.fn(),
}));

import { getGithubTreeTool } from "../../../lib/tools/retrieveGithubRepoTreeTool";
import { resolveGithubUrl } from "../../../lib/github/urlResolver";
import { fetchFromGithub } from "../../../lib/github/client";
import { extractRepoTree } from "../../../lib/github/parsers";

describe("getGithubTreeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepte un repoName valide et refuse les mauvais paramètres", async () => {
    await expect(getGithubTreeTool.invoke({ repoName: "portfolio" })).resolves.toBeTypeOf("string");
    await expect(getGithubTreeTool.invoke({} as any)).rejects.toThrow();
    await expect(getGithubTreeTool.invoke({ repoName: "" })).rejects.toThrow();
  });

  it("construit l’URL, appelle le client et le bon parseur", async () => {
    const rawTree = {
      sha: "tree-sha",
      url: "https://api.github.com/repos/alice/portfolio/git/trees/tree-sha",
      tree: [
        { path: "src", type: "tree" },
        { path: "src/app/page.tsx", type: "blob", size: 120 },
      ],
    };

    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true");
    vi.mocked(fetchFromGithub).mockResolvedValue(rawTree as any);
    vi.mocked(extractRepoTree).mockReturnValue({
      sha: "tree-sha",
      url: "https://api.github.com/repos/alice/portfolio/git/trees/tree-sha",
      tree: [
        { path: "src", type: "tree" },
        { path: "src/app/page.tsx", type: "blob", size: 120 },
      ],
    });

    const result = await getGithubTreeTool.invoke({ repoName: "portfolio" });

    expect(resolveGithubUrl).toHaveBeenCalledTimes(1);
    expect(resolveGithubUrl).toHaveBeenCalledWith("repo_tree", { repoName: "portfolio" });

    expect(fetchFromGithub).toHaveBeenCalledTimes(1);
    expect(fetchFromGithub).toHaveBeenCalledWith("https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true");

    expect(extractRepoTree).toHaveBeenCalledTimes(1);
    expect(extractRepoTree).toHaveBeenCalledWith(rawTree);

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual({
      sha: "tree-sha",
      url: "https://api.github.com/repos/alice/portfolio/git/trees/tree-sha",
      tree: [
        { path: "src", type: "tree" },
        { path: "src/app/page.tsx", type: "blob", size: 120 },
      ],
    });
  });

  it("retourne une chaîne JSON quand le parseur signale une erreur", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true");
    vi.mocked(fetchFromGithub).mockResolvedValue({ ok: true } as any);
    vi.mocked(extractRepoTree).mockReturnValue({ error: "Branch not found" } as any);

    const result = await getGithubTreeTool.invoke({ repoName: "portfolio" });

    expect(result).toBe(JSON.stringify({ error: "Branch not found" }));
  });

  it("gère les erreurs exceptionnelles et retourne toujours une chaîne JSON", async () => {
    vi.mocked(resolveGithubUrl).mockImplementation(() => {
      throw new Error("GITHUB_USERNAME manquant");
    });

    const result = await getGithubTreeTool.invoke({ repoName: "portfolio" });

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual({
      error: "Impossible de récupérer l'arborescence pour le dépôt portfolio.",
    });
  });

  it("gère correctement un client qui retourne une erreur de connexion", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/repos/alice/portfolio/git/trees/main?recursive=true");
    vi.mocked(fetchFromGithub).mockResolvedValue({ error: "Échec de la connexion à l'API GitHub." } as any);
    vi.mocked(extractRepoTree).mockReturnValue({ error: "Échec de la connexion à l'API GitHub." } as any);

    const result = await getGithubTreeTool.invoke({ repoName: "portfolio" });

    expect(result).toBe(JSON.stringify({ error: "Échec de la connexion à l'API GitHub." }));
  });
});
