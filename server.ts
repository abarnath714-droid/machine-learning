import "dotenv/config";
import express from "express";
import path from "node:path";
import dns from "node:dns/promises";
import net from "node:net";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function isPrivateOrBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
      return true;
    }
    if (normalized.startsWith("::ffff:")) {
      const mappedV4 = normalized.slice(7);
      if (net.isIPv4(mappedV4)) return isPrivateOrBlockedIp(mappedV4);
    }
    return false;
  }

  return true;
}

async function validatePublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Please enter a valid web address starting with https:// or http://.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS article URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Local or internal network addresses cannot be inspected.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      throw new Error("Private or restricted IP addresses cannot be accessed.");
    }
    return parsed;
  }

  const records = await dns.lookup(hostname, { all: true }).catch(() => []);
  if (records.length === 0) {
    throw new Error("Could not resolve the website domain. Check the URL and try again.");
  }

  for (const record of records) {
    if (isPrivateOrBlockedIp(record.address)) {
      throw new Error("This URL resolves to a restricted network address and cannot be fetched.");
    }
  }

  return parsed;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    );
    res.json({ ok: true, aiConfigured: hasKey });
  });

  app.post("/api/extract-url", async (req, res) => {
    try {
      const rawUrl = typeof req.body?.url === "string" ? req.body.url : "";
      if (!rawUrl.trim()) {
        res.status(400).json({ error: "Please provide a news article URL." });
        return;
      }

      const targetUrl = await validatePublicHttpUrl(rawUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let response: Response;
      try {
        response = await fetch(targetUrl.toString(), {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; VeritasLensBot/1.0; +https://veritaslens.example)",
            Accept: "text/html,application/xhtml+xml",
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const statusMsg =
          response.status === 401 || response.status === 403
            ? "This publisher blocks automated access or requires a subscription/login."
            : response.status === 404
            ? "The article page was not found (404). Please verify the URL."
            : `The website returned HTTP ${response.status} and could not be accessed.`;
        res.status(422).json({ error: statusMsg });
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        res.status(422).json({
          error: "The provided URL does not point to a readable HTML news page.",
        });
        return;
      }

      const html = await response.text();
      if (html.length > 2_500_000) {
        res.status(422).json({
          error: "The webpage is too large to extract cleanly. Please paste the article text instead.",
        });
        return;
      }

      const $ = cheerio.load(html);
      $("script, style, noscript, iframe, svg, nav, footer, aside, form, button").remove();

      const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
      const h1Title = $("h1").first().text().replace(/\s+/g, " ").trim();
      const docTitle = $("title").first().text().replace(/\s+/g, " ").trim();
      const title = ogTitle || h1Title || docTitle || targetUrl.hostname;

      const paragraphs: string[] = [];
      const primaryContainer = $("article, main, [role='main']").first();
      const scope = primaryContainer.length > 0 ? primaryContainer : $("body");

      scope.find("p").each((_idx, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.length >= 35) {
          paragraphs.push(text);
        }
      });

      const extractedText = paragraphs.join("\n\n").slice(0, 18000);
      if (extractedText.length < 100) {
        res.status(422).json({
          error:
            "Could not extract enough article text from this page. It may load content dynamically or sit behind a paywall—please copy and paste the article text directly.",
        });
        return;
      }

      res.json({
        title,
        text: extractedText,
        domain: targetUrl.hostname.replace(/^www\./, ""),
        url: targetUrl.toString(),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "The website took too long to respond (timed out after 10 seconds)."
          : error instanceof Error
          ? error.message
          : "Unable to access this article URL.";
      res.status(422).json({ error: message });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
      const sourceUrl = typeof req.body?.sourceUrl === "string" ? req.body.sourceUrl.trim() : "";

      if (text.length < 40) {
        res.status(400).json({
          error: "Please enter at least 40 characters of news content to run an accurate analysis.",
        });
        return;
      }

      const clippedText = text.slice(0, 20000);
      const ai = getGeminiClient();

      const prompt = `Analyze the following news article/claim for journalistic credibility, misinformation signals, and linguistic manipulation.

Important analytical rules:
1. Classify the content into exactly one verdict: "Real", "Fake", or "Suspicious".
   - "Real": Grounded, balanced, verifiable journalistic style with attributed sources, consistent facts, and measured tone.
   - "Fake": Fabricated claims, clear factual impossibilities or conspiracy tropes, severe contradictions, deceptive manipulation, or fabricated/non-existent attribution presented as fact.
   - "Suspicious": Mixed credibility signals, unverified claims, missing attribution, sensational framing, or emotionally charged persuasion that warrants independent verification before trusting.
2. CRITICAL: Do NOT assume that missing sources or emotional language automatically prove news is fake. Opinion pieces, breaking alerts, or short summaries may lack citations without being fabricated; reflect nuance by classifying uncertain/unverified cases as "Suspicious" and explaining why.
3. Provide realScore and fakeScore (each 0 to 100, summing close to 100, or reflecting evidence balance) and confidence (0 to 100).
4. Evaluate all 6 suspicion indicator categories explicitly:
   - "Sensational Headline"
   - "Misleading Statement"
   - "Unverified Claim"
   - "Missing Credible Sources"
   - "Emotional Exaggeration"
   - "Internal Contradiction"
5. Extract up to 5 exact sentences or distinct phrases verbatim from the submitted text in suspiciousSentences that warrant reader attention, along with a clear explanation of why each sentence needs scrutiny. Only quote text that actually appears in the submitted content.
6. Extract 4 to 8 important keywords/phrases from the text with a brief relevance note.

${title ? `Submitted Title: ${title}\n` : ""}${sourceUrl ? `Source URL: ${sourceUrl}\n` : ""}
Article Text:
"""
${clippedText}
"""`;

      const callModelWithRetry = async () => {
        const delays = [500, 1200];
        for (let attempt = 0; attempt <= delays.length; attempt++) {
          try {
            return await ai.models.generateContent({
              model: "gemini-4-hydrogen",
              contents: prompt,
              config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                systemInstruction:
                  "You are an objective, non-partisan media literacy and journalistic verification analyst. Evaluate evidence fairly, highlight exact suspicious sentences verbatim from the user's text, and clearly distinguish unverified or emotional reporting from proven fabrication.",
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    verdict: {
                      type: Type.STRING,
                      enum: ["Real", "Fake", "Suspicious"],
                    },
                    confidence: { type: Type.NUMBER },
                    realScore: { type: Type.NUMBER },
                    fakeScore: { type: Type.NUMBER },
                    inferredTitle: { type: Type.STRING },
                    summaryExplanation: { type: Type.STRING },
                    indicators: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          category: {
                            type: Type.STRING,
                            enum: [
                              "Sensational Headline",
                              "Misleading Statement",
                              "Unverified Claim",
                              "Missing Credible Sources",
                              "Emotional Exaggeration",
                              "Internal Contradiction",
                            ],
                          },
                          present: { type: Type.BOOLEAN },
                          severity: {
                            type: Type.STRING,
                            enum: ["low", "medium", "high"],
                          },
                          detail: { type: Type.STRING },
                        },
                        required: ["category", "present", "severity", "detail"],
                      },
                    },
                    suspiciousSentences: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          sentence: { type: Type.STRING },
                          reason: { type: Type.STRING },
                          indicatorType: { type: Type.STRING },
                        },
                        required: ["sentence", "reason", "indicatorType"],
                      },
                    },
                    keywords: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          relevance: { type: Type.STRING, enum: ["high", "medium"] },
                          note: { type: Type.STRING },
                        },
                        required: ["term", "relevance", "note"],
                      },
                    },
                  },
                  required: [
                    "verdict",
                    "confidence",
                    "realScore",
                    "fakeScore",
                    "inferredTitle",
                    "summaryExplanation",
                    "indicators",
                    "suspiciousSentences",
                    "keywords",
                  ],
                },
              },
            });
          } catch (err) {
            const errText = err instanceof Error ? err.message : String(err);
            const isTransient = errText.includes("503") || errText.includes("UNAVAILABLE");
            if (isTransient && attempt < delays.length) {
              await new Promise((r) => setTimeout(r, delays[attempt]));
              continue;
            }
            throw err;
          }
        }
        throw new Error("Transient AI service timeout");
      };

      const response = await callModelWithRetry();

      const rawJson = response.text?.trim();
      if (!rawJson) {
        res.status(502).json({ error: "The AI model returned an empty response. Please retry." });
        return;
      }

      const parsed = JSON.parse(rawJson);
      res.json({
        ...parsed,
        analysisMode: "gemini-ai",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[/api/analyze] Error:", msg);
      if (msg === "GEMINI_API_KEY_MISSING") {
        res.status(503).json({
          code: "AI_KEY_MISSING",
          error:
            "AI analysis service is not configured with an active Gemini API key in Secrets. You can configure GEMINI_API_KEY or run the Local Heuristic Demo.",
        });
        return;
      }
      if (msg.includes("403") || msg.includes("API_KEY_INVALID") || msg.includes("PERMISSION_DENIED")) {
        res.status(502).json({
          code: "AI_AUTH_ERROR",
          error:
            "The configured Gemini API key was rejected. Please verify GEMINI_API_KEY in Settings > Secrets, or run the Local Heuristic Demo.",
        });
        return;
      }
      res.status(500).json({
        code: "AI_SERVICE_ERROR",
        error: `Unable to complete AI verification right now (${msg.slice(0, 120)}). You can retry or run the Local Heuristic Demo.`,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VeritasLens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
