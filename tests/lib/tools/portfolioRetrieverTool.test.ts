import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import dotenv from "dotenv";
describe("portfolioRetrieverTool - intégration", () => {
  beforeEach(() => {
    dotenv.config({ path: ".env.local" });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it(
    "récupère un résultat texte valide depuis la vraie Pinecone quand on appelle l'outil",
    async () => {
      const { getRetrieverTool } = await import("../../../lib/tools/portfolioRetrieverTool");
      const tool = await getRetrieverTool();

      expect(tool).toBeDefined();
      expect(tool.name).toBe("recherche_cv_portfolio");
      expect(typeof tool.invoke).toBe("function");

      const result = await tool.invoke({
        query: "Parle-moi du profil, des compétences et des expériences de l'ingénieur.",
      });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(100);

      const lower = result.toLowerCase();
      expect(lower).toMatch(
        /next\.js|react|typescript|javascript|portfolio|développeur|ingénieur|compétence|expérience|cv/i,
      );
    },
    30000,
  );

  it("renvoie bien une erreur si les variables d'environnement Pinecone sont absentes", async () => {
    vi.stubEnv("VECTOR_DATABASE_API_KEY", "");
    const { getRetrieverTool } = await import("../../../lib/tools/portfolioRetrieverTool");
    await expect(getRetrieverTool()).rejects.toThrow(
      "Missing required environment variable: VECTOR_DATABASE_API_KEY",
    );
  });
}
);
