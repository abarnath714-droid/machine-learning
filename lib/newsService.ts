import dns from "node:dns/promises";
import type { IncomingMessage } from "node:http";
import net from "node:net";
import * as cheerio from "cheerio";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface ServiceResult<T = Record<string, unknown>> {
  status: number;
  body: T;
}

export async function parseJsonBody(
  req: IncomingMessage & { body?: unknown }
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === "string") {
    return req.body.trim() ? (JSON.parse(req.body) as Record<string, unknown>) : {};
  }
  if (Buffer.isBuffer(req.body)) {
    const str = req.body.toString("utf8").trim();
    return str ? (JSON.parse(str) as Record<string, unknown>) : {};
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

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
    if (
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd")
    ) {
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

function getGeminiApiKey(): string | undefined {
  const raw = process.env.GEMINI_API_KEY?.trim();
  if (!raw || raw === "MY_GEMINI_API_KEY") {
    return undefined;
  }
  return raw;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
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

export function getHealthStatus(): ServiceResult {
  return {
    status: 200,
    body: {
      ok: true,
      aiConfigured: Boolean(getGeminiApiKey()),
    },
  };
}

export async function extractArticleFromUrl(
  rawUrlInput: unknown
): Promise<ServiceResult> {
  try {
    const rawUrl = typeof rawUrlInput === "string" ? rawUrlInput : "";
    if (!rawUrl.trim()) {
      return {
        status: 400,
        body: { error: "Please provide a news article URL." },
      };
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
      return { status: 422, body: { error: statusMsg } };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return {
        status: 422,
        body: { error: "The provided URL does not point to a readable HTML news page." },
      };
    }

    const html = await response.text();
    if (html.length > 2_500_000) {
      return {
        status: 422,
        body: {
          error:
            "The webpage is too large to extract cleanly. Please paste the article text instead.",
        },
      };
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
      return {
        status: 422,
        body: {
          error:
            "Could not extract enough article text from this page. It may load content dynamically or sit behind a paywall—please copy and paste the article text directly.",
        },
      };
    }

    return {
      status: 200,
      body: {
        title,
        text: extractedText,
        domain: targetUrl.hostname.replace(/^www\./, ""),
        url: targetUrl.toString(),
      },
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The website took too long to respond (timed out after 10 seconds)."
        : error instanceof Error
        ? error.message
        : "Unable to access this article URL.";
    return { status: 422, body: { error: message } };
  }
}

export async function analyzeNewsWithGemini(payload: {
  text?: unknown;
  title?: unknown;
  sourceUrl?: unknown;
}): Promise<ServiceResult> {
  try {
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const sourceUrl = typeof payload.sourceUrl === "string" ? payload.sourceUrl.trim() : "";

    if (text.length < 40) {
      return {
        status: 400,
        body: {
          code: "INVALID_INPUT",
          error: "Please enter at least 40 characters of news content to run an accurate analysis.",
        },
      };
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
      return {
        status: 502,
        body: {
          code: "AI_EMPTY_RESPONSE",
          error: "The AI model returned an empty response. Please retry.",
        },
      };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawJson) as Record<string, unknown>;
    } catch {
      return {
        status: 502,
        body: {
          code: "AI_INVALID_JSON",
          error: "The AI model returned a non-JSON response. Please retry.",
        },
      };
    }

    return {
      status: 200,
      body: {
        ...parsed,
        analysisMode: "gemini-ai",
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[/api/analyze] Error:", msg);

    if (msg === "GEMINI_API_KEY_MISSING") {
      return {
        status: 503,
        body: {
          code: "AI_KEY_MISSING",
          error:
            "GEMINI_API_KEY is not configured in environment variables. Add GEMINI_API_KEY in Vercel Project Settings (or AI Studio Secrets), or run the Local Heuristic Demo.",
        },
      };
    }

    if (
      msg.includes("403") ||
      msg.includes("API_KEY_INVALID") ||
      msg.includes("PERMISSION_DENIED")
    ) {
      return {
        status: 502,
        body: {
          code: "AI_AUTH_ERROR",
          error: `Gemini API rejected the configured GEMINI_API_KEY: ${msg.slice(0, 180)}`,
        },
      };
    }

    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return {
        status: 429,
        body: {
          code: "AI_QUOTA_EXCEEDED",
          error: `Gemini API rate limit or quota exceeded: ${msg.slice(0, 180)}`,
        },
      };
    }

    if (msg.includes("404") || msg.includes("NOT_FOUND")) {
      return {
        status: 502,
        body: {
          code: "AI_MODEL_ERROR",
          error: `Gemini model request failed (404): ${msg.slice(0, 180)}`,
        },
      };
    }

    return {
      status: 500,
      body: {
        code: "AI_SERVICE_ERROR",
        error: `AI verification failed: ${msg.slice(0, 200)}`,
      },
    };
  }
}
