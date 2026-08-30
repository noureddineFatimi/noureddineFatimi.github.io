import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadClient = async () => import("../../../lib/github/client");

describe("fetchFromGithub", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN = "test-token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    vi.clearAllMocks();
  });

  it("lève une erreur si le token est absent", async () => {
    const { fetchFromGithub } = await loadClient();
    delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    await expect(fetchFromGithub("https://api.github.com/repos/alice/portfolio")).rejects.toThrow(
      "Erreur critique : GITHUB_PERSONAL_ACCESS_TOKEN est manquant.",
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("retourne les données JSON pour une réponse HTTP 200", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1, name: "portfolio" }),
    } as any);

    await expect(fetchFromGithub("https://api.github.com/repos/alice/portfolio")).resolves.toEqual({
      id: 1,
      name: "portfolio",
    });
  });

  it("retourne une erreur explicite pour une réponse 404", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as any);

    await expect(fetchFromGithub("https://api.github.com/repos/missing/repo")).resolves.toEqual({
      error: "Ressource introuvable (404). Vérifiez le nom du dépôt ou le chemin du fichier.",
    });
  });

  it("retourne une erreur explicite pour une réponse 403", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    } as any);

    await expect(fetchFromGithub("https://api.github.com/repos/alice/portfolio")).resolves.toEqual({
      error: "Limite de requêtes GitHub atteinte (403). Veuillez réessayer plus tard.",
    });
  });

  it("retourne une erreur explicite pour une autre erreur HTTP", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as any);

    await expect(fetchFromGithub("https://api.github.com/repos/alice/portfolio")).resolves.toEqual({
      error: "Erreur API GitHub HTTP 500: Internal Server Error",
    });
  });

  it("retourne une erreur réseau quand fetch échoue", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockRejectedValue(new Error("Network down"));

    await expect(fetchFromGithub("https://api.github.com/repos/alice/portfolio")).resolves.toEqual({
      error: "Échec de la connexion à l'API GitHub.",
    });
  });

  it("envoie les headers corrects et le bon cache policy", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    } as any);

    await fetchFromGithub("https://api.github.com/user");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer test-token",
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }),
    );
  });

  it("verifie que l’autorisation est bien envoyée dans le header Authorization", async () => {
    const { fetchFromGithub } = await loadClient();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    } as any);

    await fetchFromGithub("https://api.github.com/repos/alice/portfolio");

    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer test-token",
    });
  });
});
