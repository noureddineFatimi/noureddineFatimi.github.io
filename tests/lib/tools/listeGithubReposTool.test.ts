import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/github/urlResolver.ts", () => ({
  resolveGithubUrl: vi.fn(),
}));

vi.mock("../../../lib/github/client.ts", () => ({
  fetchFromGithub: vi.fn(),
}));

vi.mock("../../../lib/github/parsers.ts", () => ({
  extractMinimalRepos: vi.fn(),
}));

import { listGithubReposTool } from "../../../lib/tools/listeGithubReposTool";
import { resolveGithubUrl } from "../../../lib/github/urlResolver";
import { fetchFromGithub } from "../../../lib/github/client";
import { extractMinimalRepos } from "../../../lib/github/parsers";

describe("listGithubReposTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepte les paramètres du schéma vide sans besoin de repoName", async () => {
    const result = await listGithubReposTool.invoke({});
    expect(typeof result).toBe("string");

    const resultWithExtraProps = await listGithubReposTool.invoke({ extra: "ignored" } as any);
    expect(typeof resultWithExtraProps).toBe("string");
  });

  it("construit l’URL, appelle le client et le bon parseur", async () => {
    const rawRepos = [{ id: 1, name: "portfolio", full_name: "alice/portfolio", private: false }];
    const parsedRepos = [{ id: 1, name: "portfolio", full_name: "alice/portfolio", private: false }];

    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/users/alice/repos?sort=updated&per_page=100");
    vi.mocked(fetchFromGithub).mockResolvedValue(rawRepos as any);
    vi.mocked(extractMinimalRepos).mockReturnValue(parsedRepos as any);

    const result = await listGithubReposTool.invoke({});

    expect(resolveGithubUrl).toHaveBeenCalledTimes(1);
    expect(resolveGithubUrl).toHaveBeenCalledWith("list_repos");

    expect(fetchFromGithub).toHaveBeenCalledTimes(1);
    expect(fetchFromGithub).toHaveBeenCalledWith("https://api.github.com/users/alice/repos?sort=updated&per_page=100");

    expect(extractMinimalRepos).toHaveBeenCalledTimes(1);
    expect(extractMinimalRepos).toHaveBeenCalledWith(rawRepos);

    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual(parsedRepos);
  });

  it("retourne une chaîne JSON quand le parseur signale une erreur", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/users/alice/repos");
    vi.mocked(fetchFromGithub).mockResolvedValue([{ id: 1 }]);
    vi.mocked(extractMinimalRepos).mockReturnValue({ error: "rate limit" } as any);

    const result = await listGithubReposTool.invoke({});

    expect(result).toBe(JSON.stringify({ error: "rate limit" }));
  });

  it("gère les erreurs inattendues et retourne toujours une chaîne JSON", async () => {
    vi.mocked(resolveGithubUrl).mockImplementation(() => {
      throw new Error("GITHUB_USERNAME manquant");
    });

    const result = await listGithubReposTool.invoke({});

    expect(result).toBe(
      JSON.stringify({ error: "Une erreur inattendue est survenue lors de la récupération des dépôts." }),
    );
  });

  it("retourne une chaîne JSON même si le client échoue avec une erreur de connexion", async () => {
    vi.mocked(resolveGithubUrl).mockReturnValue("https://api.github.com/users/alice/repos");
    vi.mocked(fetchFromGithub).mockResolvedValue({ error: "Échec de la connexion à l'API GitHub." } as any);
    vi.mocked(extractMinimalRepos).mockReturnValue({ error: "Échec de la connexion à l'API GitHub." } as any);

    const result = await listGithubReposTool.invoke({});

    expect(result).toBe(JSON.stringify({ error: "Échec de la connexion à l'API GitHub." }));
  });
});
