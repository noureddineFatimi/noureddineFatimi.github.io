import { beforeEach, describe, expect, it, vi } from "vitest";

const loadParsers = async () => {
  vi.resetModules();
  return import("../../../lib/github/parsers");
};

describe("extractMinimalRepos", () => {
  it("transforme un tableau valide de dépôts", async () => {
    const { extractMinimalRepos } = await loadParsers();

    const rawRepos = [
      { id: 1, name: "repo-1", full_name: "alice/repo-1", private: false },
      { id: 2, name: "repo-2", full_name: "alice/repo-2", private: true },
    ];

    expect(extractMinimalRepos(rawRepos)).toEqual([
      { id: 1, name: "repo-1", full_name: "alice/repo-1", private: false },
      { id: 2, name: "repo-2", full_name: "alice/repo-2", private: true },
    ]);
  });

  it("retourne un tableau vide pour une réponse vide", async () => {
    const { extractMinimalRepos } = await loadParsers();

    expect(extractMinimalRepos([])).toEqual([]);
  });

  it("propage une erreur quand l’API renvoie un objet error", async () => {
    const { extractMinimalRepos } = await loadParsers();

    expect(extractMinimalRepos({ error: "github rate limit" })).toEqual({
      error: "github rate limit",
    });
  });

  it("renvoie une erreur si la réponse n’est pas un tableau", async () => {
    const { extractMinimalRepos } = await loadParsers();

    expect(extractMinimalRepos({ ok: true } as any)).toEqual({
      error: "La réponse de l'API GitHub n'est pas une liste valide de dépôts.",
    });
  });
});

describe("extractRepoMetadata", () => {
  it("extrait toutes les propriétés du dépôt", async () => {
    const { extractRepoMetadata } = await loadParsers();

    const rawData = {
      id: 12,
      name: "portfolio",
      full_name: "alice/portfolio",
      private: false,
      description: "Mon portfolio",
      fork: false,
      html_url: "https://github.com/alice/portfolio",
      updated_at: "2024-01-02T00:00:00Z",
      created_at: "2023-12-01T00:00:00Z",
      pushed_at: "2024-01-03T00:00:00Z",
      size: 128,
      homepage: "https://alice.dev",
      language: "TypeScript",
      visibility: "public",
      default_branch: "main",
      has_issues: true,
    };

    expect(extractRepoMetadata(rawData)).toEqual({
      id: 12,
      name: "portfolio",
      full_name: "alice/portfolio",
      private: false,
      description: "Mon portfolio",
      fork: false,
      html_url: "https://github.com/alice/portfolio",
      updated_at: "2024-01-02T00:00:00Z",
      created_at: "2023-12-01T00:00:00Z",
      pushed_at: "2024-01-03T00:00:00Z",
      size: 128,
      homepage: "https://alice.dev",
      language: "TypeScript",
      visibility: "public",
      default_branch: "main",
      has_issues: true,
    });
  });

  it("propage une erreur GitHub", async () => {
    const { extractRepoMetadata } = await loadParsers();

    expect(extractRepoMetadata({ error: "repo not found" })).toEqual({
      error: "repo not found",
    });
  });
});

describe("extractRepoCommits", () => {
  it("transforme les commits avec leurs champs essentiels", async () => {
    const { extractRepoCommits } = await loadParsers();

    const rawData = [
      {
        sha: "abc123",
        url: "https://api.github.com/repos/alice/portfolio/commits/abc123",
        html_url: "https://github.com/alice/portfolio/commit/abc123",
        commit: {
          author: {
            name: "Alice",
            email: "alice@example.com",
            date: "2024-01-01T00:00:00Z",
          },
          message: "Initial commit",
        },
        parents: [
          {
            sha: "parent-1",
            url: "https://api.github.com/repos/alice/portfolio/commits/parent-1",
            html_url: "https://github.com/alice/portfolio/commit/parent-1",
          },
        ],
      },
    ];

    expect(extractRepoCommits(rawData)).toEqual([
      {
        sha: "abc123",
        url: "https://api.github.com/repos/alice/portfolio/commits/abc123",
        html_url: "https://github.com/alice/portfolio/commit/abc123",
        commit: {
          author: {
            name: "Alice",
            email: "alice@example.com",
            date: "2024-01-01T00:00:00Z",
          },
          message: "Initial commit",
        },
        parents: [
          {
            sha: "parent-1",
            url: "https://api.github.com/repos/alice/portfolio/commits/parent-1",
            html_url: "https://github.com/alice/portfolio/commit/parent-1",
          },
        ],
      },
    ]);
  });

  it("transforme correctement les parents de chaque commit", async () => {
    const { extractRepoCommits } = await loadParsers();

    const rawData = [
      {
        sha: "abc123",
        url: "https://api.github.com/repos/alice/portfolio/commits/abc123",
        html_url: "https://github.com/alice/portfolio/commit/abc123",
        commit: {
          author: {
            name: "Alice",
            email: "alice@example.com",
            date: "2024-01-01T00:00:00Z",
          },
          message: "Second commit",
        },
        parents: [
          { sha: "p1", url: "u1", html_url: "h1" },
          { sha: "p2", url: "u2", html_url: "h2" },
        ],
      },
    ];

    const result = extractRepoCommits(rawData) as any[];
    expect(result[0].parents).toEqual([
      { sha: "p1", url: "u1", html_url: "h1" },
      { sha: "p2", url: "u2", html_url: "h2" },
    ]);
  });

  it("renvoie une erreur si la réponse n’est pas un tableau", async () => {
    const { extractRepoCommits } = await loadParsers();

    expect(extractRepoCommits({ ok: true } as any)).toEqual({
      error: "La réponse de l'API pour les commits n'est pas un tableau valide.",
    });
  });

  it("renvoie les champs correctement si un commit est mal formé", async () => {
    const { extractRepoCommits } = await loadParsers();

    const rawData = [
      {
        sha: "abc123",
        url: "https://api.github.com/repos/alice/portfolio/commits/abc123",
        html_url: "https://github.com/alice/portfolio/commit/abc123",
        commit: null,
        parents: [],
      },
    ] as any;

    expect(extractRepoCommits(rawData)).toEqual([
      {
        "commit": {
          "author": {
            "date": undefined,
            "email": undefined,
            "name": undefined,
          },
          "message": undefined,
        },
        "html_url": "https://github.com/alice/portfolio/commit/abc123",
        "parents": [],
        "sha": "abc123",
        "url": "https://api.github.com/repos/alice/portfolio/commits/abc123",
      },
    ]);
  });
});

describe("extractRepoLanguages", () => {
  it("renvoie l’objet tel quel pour un payload valide", async () => {
    const { extractRepoLanguages } = await loadParsers();

    const rawData = { TypeScript: 45000, HTML: 1200 };
    expect(extractRepoLanguages(rawData)).toEqual(rawData);
  });

  it("renvoie une erreur si le payload est un tableau, null ou invalide", async () => {
    const { extractRepoLanguages } = await loadParsers();

    expect(extractRepoLanguages(["TypeScript"] as any)).toEqual({
      error: "Le format des langages renvoyé par GitHub est invalide.",
    });
    expect(extractRepoLanguages(null as any)).toEqual({
      error: "Le format des langages renvoyé par GitHub est invalide.",
    });
    expect(extractRepoLanguages("TypeScript" as any)).toEqual({
      error: "Le format des langages renvoyé par GitHub est invalide.",
    });
  });
});

describe("decodeBase64Content", () => {
  it("décodage d’un texte simple", async () => {
    const { decodeBase64Content } = await loadParsers();

    const encoded = Buffer.from("Bonjour le monde").toString("base64");
    expect(decodeBase64Content(encoded)).toBe("Bonjour le monde");
  });

  it("ignore les retours à la ligne présents dans le Base64", async () => {
    const { decodeBase64Content } = await loadParsers();

    const encoded = `aGVsbG8=
`;
    expect(decodeBase64Content(encoded)).toBe("hello");
  });
});

describe("extractFileContent", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("lit un fichier Base64 valide", async () => {
    const { extractFileContent } = await loadParsers();

    const rawData = {
      path: "src/app/page.tsx",
      url: "https://api.github.com/repos/alice/portfolio/contents/src/app/page.tsx",
      html_url: "https://github.com/alice/portfolio/blob/main/src/app/page.tsx",
      encoding: "base64",
      content: Buffer.from("export const value = 42;\n").toString("base64"),
    };

    expect(extractFileContent(rawData, "src/app/page.tsx")).toEqual({
      path: "src/app/page.tsx",
      url: "https://api.github.com/repos/alice/portfolio/contents/src/app/page.tsx",
      html_url: "https://github.com/alice/portfolio/blob/main/src/app/page.tsx",
      content: "export const value = 42;\n",
      truncated: false,
    });
  });

  it("renvoie une erreur si le chemin pointe vers un dossier", async () => {
    const { extractFileContent } = await loadParsers();

    expect(extractFileContent(["src/app"] as any, "src/app")).toEqual({
      error: "Le chemin 'src/app' pointe vers un dossier, pas vers un fichier.",
    });
  });

  it("renvoie une erreur si le contenu n’est pas encodé en Base64", async () => {
    const { extractFileContent } = await loadParsers();

    expect(
      extractFileContent(
        { path: "README.md", url: "u", html_url: "h", encoding: "utf-8", content: "text" },
        "README.md",
      ),
    ).toEqual({
      "error": "Le format du fichier 'README.md' n'est pas supporté (non-base64) ou son contenu est null.",
    });
  });

  it("tronque le contenu si la limite est dépassée", async () => {
    vi.stubEnv("READING_GITHUB_FILE_MAX_FILE_LENGTH", "10");
    const { extractFileContent } = await loadParsers();

    const rawData = {
      path: "README.md",
      url: "https://api.github.com/repos/alice/portfolio/contents/README.md",
      html_url: "https://github.com/alice/portfolio/blob/main/README.md",
      encoding: "base64",
      content: Buffer.from("123456789012345").toString("base64"),
    };

    expect(extractFileContent(rawData, "README.md")).toEqual({
      path: "README.md",
      url: "https://api.github.com/repos/alice/portfolio/contents/README.md",
      html_url: "https://github.com/alice/portfolio/blob/main/README.md",
      content: "1234567890\n\n... [CONTENU TRONQUÉ CAR TROP LONG] ...",
      truncated: true,
    });
  });

  it("propage une erreur GitHub levée par l’API", async () => {
    const { extractFileContent } = await loadParsers();

    expect(extractFileContent({ error: "Not Found" } as any, "missing.txt")).toEqual({
      error: "Fichier 'missing.txt' introuvable ou inaccessible. Détail: Not Found",
    });
  });
});

describe("extractRepoTree", () => {
  it("transforme un arbre valide", async () => {
    const { extractRepoTree } = await loadParsers();

    const rawData = {
      sha: "tree-sha",
      url: "https://api.github.com/repos/alice/portfolio/git/trees/tree-sha",
      tree: [
        { path: "src", type: "tree", size: undefined },
        { path: "src/app/page.tsx", type: "blob", size: 120 },
      ],
    };

    expect(extractRepoTree(rawData)).toEqual({
      sha: "tree-sha",
      url: "https://api.github.com/repos/alice/portfolio/git/trees/tree-sha",
      tree: [
        { path: "src", type: "tree", size: undefined },
        { path: "src/app/page.tsx", type: "blob", size: 120 },
      ],
    });
  });

  it("renvoie une erreur si l’arbre est absent", async () => {
    const { extractRepoTree } = await loadParsers();

    expect(extractRepoTree({ sha: "abc" } as any)).toEqual({
      error: "Impossible de lire l'arborescence. La branche 'main' n'existe peut-être pas sur ce dépôt.",
    });
  });

  it("propage une erreur GitHub", async () => {
    const { extractRepoTree } = await loadParsers();

    expect(extractRepoTree({ error: "Branch not found" })).toEqual({
      error: "Branch not found",
    });
  });
});
