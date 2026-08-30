import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/github/urlResolver.ts", () => ({
  resolveGithubUrl: vi.fn(),
}));

vi.mock("../../../lib/github/client.ts", () => ({
  fetchFromGithub: vi.fn(),
}));

vi.mock("../../../lib/github/parsers.ts", () => ({
  extractFileContent: vi.fn(),
}));

import { readGithubFilesTool } from "../../../lib/tools/readerGithubReposFileTool";
import { resolveGithubUrl } from "../../../lib/github/urlResolver";
import { fetchFromGithub } from "../../../lib/github/client";
import { extractFileContent } from "../../../lib/github/parsers";

describe("readGithubFilesTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepte les bons paramètres et refuse les invalides", async () => {
    await expect(readGithubFilesTool.invoke({ repoName: "portfolio", filePaths: ["README.md"] })).resolves.toBeTypeOf("string");
    await expect(readGithubFilesTool.invoke({ repoName: "portfolio", filePaths: [] })).rejects.toThrow();
    await expect(readGithubFilesTool.invoke({ repoName: "portfolio", filePaths: Array(6).fill("a") })).rejects.toThrow();
    await expect(readGithubFilesTool.invoke({ repoName: "portfolio" } as any)).rejects.toThrow();
  });

  it("construit l’URL pour chaque fichier, appelle le client et le bon parseur", async () => {
    vi.mocked(resolveGithubUrl)
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/contents/README.md")
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/contents/src/app/page.tsx");

    vi.mocked(fetchFromGithub)
      .mockResolvedValueOnce({ content: "# titre" } as any)
      .mockResolvedValueOnce({ content: "export const x = 1" } as any);

    vi.mocked(extractFileContent)
      .mockReturnValueOnce({
        path: "README.md",
        content: "# titre",
        url: "u1",
        html_url: "h1",
        truncated: false,
      })
      .mockReturnValueOnce({
        path: "src/app/page.tsx",
        content: "export const x = 1",
        url: "u2",
        html_url: "h2",
        truncated: false,
      });

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["README.md", "src/app/page.tsx"],
    });

    expect(resolveGithubUrl).toHaveBeenCalledTimes(2);
    expect(resolveGithubUrl).toHaveBeenNthCalledWith(1, "file_content", {
      repoName: "portfolio",
      filePath: "README.md",
    });
    expect(resolveGithubUrl).toHaveBeenNthCalledWith(2, "file_content", {
      repoName: "portfolio",
      filePath: "src/app/page.tsx",
    });

    expect(fetchFromGithub).toHaveBeenCalledTimes(2);
    expect(fetchFromGithub).toHaveBeenCalledWith("https://api.github.com/repos/alice/portfolio/contents/README.md");
    expect(fetchFromGithub).toHaveBeenCalledWith("https://api.github.com/repos/alice/portfolio/contents/src/app/page.tsx");

    expect(extractFileContent).toHaveBeenCalledTimes(2);
    expect(extractFileContent).toHaveBeenNthCalledWith(1, { content: "# titre" }, "README.md");
    expect(extractFileContent).toHaveBeenNthCalledWith(2, { content: "export const x = 1" }, "src/app/page.tsx");

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual([
      {
        path: "README.md",
        content: "# titre",
        url: "u1",
        html_url: "h1",
        truncated: false,
      },
      {
        path: "src/app/page.tsx",
        content: "export const x = 1",
        url: "u2",
        html_url: "h2",
        truncated: false,
      },
    ]);
  });

  it("retourne une chaîne JSON même si un fichier échoue pendant le traitement", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/repos/alice/portfolio/contents/README.md");
    vi.mocked(fetchFromGithub).mockResolvedValue({ error: "Not found" } as any);
    vi.mocked(extractFileContent).mockReturnValue({ error: "Fichier 'README.md' introuvable ou inaccessible." } as any);

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["README.md"],
    });

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual([
      { error: "Fichier 'README.md' introuvable ou inaccessible." },
    ]);
  });

  it("gère une erreur globale et retourne toujours une chaîne JSON", async () => {
    vi.mocked(resolveGithubUrl).mockImplementation(() => {
      throw new Error("Erreur globale");
    });

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["README.md"],
    });

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual([{
      error: "Échec de la récupération pour le fichier 'README.md'",
    }]);
  });

  it("ignore les erreurs individuelles sur un fichier sans arrêter le traitement de l’ensemble", async () => {
    vi.mocked(resolveGithubUrl)
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/contents/README.md")
      .mockReturnValueOnce("https://api.github.com/repos/alice/portfolio/contents/src/app/page.tsx");

    vi.mocked(fetchFromGithub)
      .mockResolvedValueOnce({ content: "# titre" } as any)
      .mockRejectedValueOnce(new Error("network issue"));

    vi.mocked(extractFileContent)
      .mockReturnValueOnce({
        path: "README.md",
        content: "# titre",
        url: "u1",
        html_url: "h1",
        truncated: false,
      })
      .mockReturnValueOnce({ error: "Échec de la récupération pour le fichier 'src/app/page.tsx'" } as any);

    const result = await readGithubFilesTool.invoke({
      repoName: "portfolio",
      filePaths: ["README.md", "src/app/page.tsx"],
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      path: "README.md",
      content: "# titre",
      url: "u1",
      html_url: "h1",
      truncated: false,
    });
    expect(parsed[1]).toEqual({ error: "Échec de la récupération pour le fichier 'src/app/page.tsx'" });
  });
});
