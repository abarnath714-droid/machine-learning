import {
  AnalysisReport,
  IndicatorCategory,
  KeywordItem,
  SuspicionIndicator,
  SuspiciousSentence,
  Verdict,
} from "../types/news";

const SENSATIONAL_TERMS = [
  "shocking",
  "secretly",
  "exposed",
  "miracle",
  "bombshell",
  "unbelievable",
  "they don't want you to know",
  "mainstream media refuses",
  "100% proven",
  "overnight",
  "banned",
  "urgent warning",
  "total collapse",
  "hoax",
  "cover-up",
];

const UNVERIFIED_PATTERNS = [
  "sources say",
  "insiders claim",
  "rumored",
  "allegedly without proof",
  "viral post",
  "anonymous whistleblower",
  "experts everywhere agree",
  "many people are saying",
];

const CREDIBLE_ATTRIBUTION_PATTERNS = [
  "according to",
  "published in",
  "researchers at",
  "spokesperson",
  "data from",
  "study found",
  "report released",
  "university of",
  "ministry of",
  "peer-reviewed",
];

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "were", "been",
  "they", "their", "about", "which", "would", "could", "there", "these", "those",
  "after", "before", "while", "where", "when", "into", "over", "under", "between",
  "said", "says", "will", "more", "than", "also", "other", "some", "such", "what",
]);

export function runLocalHeuristicDemo(params: {
  text: string;
  title?: string;
  sourceUrl?: string;
  sourceDomain?: string;
}): AnalysisReport {
  const cleanText = params.text.trim();
  const lower = cleanText.toLowerCase();
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const firstLine = cleanText.split("\n")[0]?.trim() || "Submitted News Excerpt";
  const title =
    params.title?.trim() ||
    (firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine);

  const matchedSensational = SENSATIONAL_TERMS.filter((term) => lower.includes(term));
  const matchedUnverified = UNVERIFIED_PATTERNS.filter((term) => lower.includes(term));
  const matchedAttribution = CREDIBLE_ATTRIBUTION_PATTERNS.filter((term) =>
    lower.includes(term)
  );

  const exclamationCount = (cleanText.match(/!/g) || []).length;
  const allCapsWords = (cleanText.match(/\b[A-Z]{4,}\b/g) || []).filter(
    (w) => !["NATO", "NASA", "WHO", "UNESCO", "OECD", "HTTP", "HTTPS"].includes(w)
  );

  const hasContradictionCue =
    (lower.includes("100% confirmed") || lower.includes("officially proven")) &&
    (lower.includes("unconfirmed") || lower.includes("no evidence") || lower.includes("allegedly"));

  const sensationalPresent =
    matchedSensational.length > 0 || exclamationCount >= 2 || allCapsWords.length >= 2;
  const emotionalPresent =
    matchedSensational.length >= 2 || exclamationCount >= 3 || allCapsWords.length >= 3;
  const unverifiedPresent = matchedUnverified.length > 0 || matchedAttribution.length === 0;
  const missingSourcesPresent = matchedAttribution.length === 0;
  const misleadingPresent =
    matchedSensational.length >= 2 && matchedAttribution.length === 0;

  let suspicionPoints = 0;
  if (sensationalPresent) suspicionPoints += 25;
  if (emotionalPresent) suspicionPoints += 18;
  if (unverifiedPresent) suspicionPoints += 20;
  if (missingSourcesPresent) suspicionPoints += 12;
  if (misleadingPresent) suspicionPoints += 18;
  if (hasContradictionCue) suspicionPoints += 22;

  const fakeScore = Math.min(94, Math.max(8, suspicionPoints));
  const realScore = Math.max(6, 100 - fakeScore);

  let verdict: Verdict = "Real";
  if (fakeScore >= 65) {
    verdict = "Fake";
  } else if (fakeScore >= 32) {
    verdict = "Suspicious";
  }

  const confidence =
    verdict === "Real"
      ? Math.min(92, Math.max(62, realScore))
      : verdict === "Fake"
      ? Math.min(91, Math.max(64, fakeScore))
      : 68;

  const indicators: SuspicionIndicator[] = [
    {
      category: "Sensational Headline" as IndicatorCategory,
      present: sensationalPresent,
      severity: matchedSensational.length >= 2 ? "high" : sensationalPresent ? "medium" : "low",
      detail: sensationalPresent
        ? `Detected high-arousal framing or punctuation (${[...matchedSensational.slice(0, 3)].join(", ") || "excessive emphasis"}).`
        : "Headline and opening lines use measured, non-sensational phrasing.",
    },
    {
      category: "Misleading Statement" as IndicatorCategory,
      present: misleadingPresent,
      severity: misleadingPresent ? "medium" : "low",
      detail: misleadingPresent
        ? "Strong absolute claims appear alongside minimal verifiable context."
        : "No obvious deceptive absolutist phrasing identified in lexical scan.",
    },
    {
      category: "Unverified Claim" as IndicatorCategory,
      present: unverifiedPresent,
      severity: matchedUnverified.length > 0 ? "high" : unverifiedPresent ? "medium" : "low",
      detail:
        matchedUnverified.length > 0
          ? `Relies on vague attribution (${matchedUnverified.slice(0, 2).join(", ")}).`
          : unverifiedPresent
          ? "Claims lack named studies, primary documents, or institutional citations."
          : "Claims include recognizable attribution phrases.",
    },
    {
      category: "Missing Credible Sources" as IndicatorCategory,
      present: missingSourcesPresent,
      severity: missingSourcesPresent ? "medium" : "low",
      detail: missingSourcesPresent
        ? "No explicit primary sources or named institutions were detected. Note: missing citations alone do not prove fabrication."
        : `Found attribution references (${matchedAttribution.slice(0, 3).join(", ")}).`,
    },
    {
      category: "Emotional Exaggeration" as IndicatorCategory,
      present: emotionalPresent,
      severity: emotionalPresent ? "high" : "low",
      detail: emotionalPresent
        ? "Contains emotionally charged vocabulary, uppercase emphasis, or repeated exclamation marks."
        : "Tone appears relatively neutral without overt emotional amplification.",
    },
    {
      category: "Internal Contradiction" as IndicatorCategory,
      present: hasContradictionCue,
      severity: hasContradictionCue ? "high" : "low",
      detail: hasContradictionCue
        ? "Text mixes certainty markers with statements indicating lack of confirmation."
        : "No direct lexical self-contradictions detected in heuristic scan.",
    },
  ];

  const suspiciousSentences: SuspiciousSentence[] = [];
  for (const s of sentences) {
    const sLower = s.toLowerCase();
    const hitTerm =
      SENSATIONAL_TERMS.find((t) => sLower.includes(t)) ||
      UNVERIFIED_PATTERNS.find((t) => sLower.includes(t));
    if (hitTerm || s.includes("!") || /\b[A-Z]{5,}\b/.test(s)) {
      suspiciousSentences.push({
        sentence: s,
        indicatorType: hitTerm
          ? SENSATIONAL_TERMS.includes(hitTerm)
            ? "Sensational / Emotional Framing"
            : "Unverified Attribution"
          : "Emphatic Punctuation / Caps",
        reason: hitTerm
          ? `Uses "${hitTerm}", a common rhetorical cue in unverified or click-driven reporting that should be cross-checked against primary sources.`
          : "Uses emphatic punctuation or all-caps wording rather than neutral reporting language.",
      });
    }
    if (suspiciousSentences.length >= 4) break;
  }

  const wordCounts = new Map<string, number>();
  for (const rawWord of cleanText.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)) {
    if (rawWord.length >= 5 && !STOP_WORDS.has(rawWord)) {
      wordCounts.set(rawWord, (wordCounts.get(rawWord) || 0) + 1);
    }
  }
  const keywords: KeywordItem[] = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([term, count], i) => ({
      term,
      relevance: i < 3 ? "high" : "medium",
      note: `Appears ${count} time${count > 1 ? "s" : ""} as a central topic term`,
    }));

  const summaryExplanation =
    verdict === "Real"
      ? "Local Heuristic Demo: The excerpt reads with measured language and cites recognizable attributions without major sensational markers. Still cross-check primary sources for critical decisions."
      : verdict === "Suspicious"
      ? "Local Heuristic Demo: The excerpt shows warning cues such as unattributed claims, emotional framing, or missing primary sources. Remember that missing citations or emotional tone alone do not prove an article is fake—verify with independent outlets."
      : "Local Heuristic Demo: Multiple misinformation cues—such as sensational claims, uppercase/exclamation emphasis, and lack of verifiable sourcing—strongly suggest unreliable reporting.";

  return {
    id: `demo_${Date.now()}`,
    title,
    text: cleanText,
    sourceUrl: params.sourceUrl,
    sourceDomain: params.sourceDomain,
    verdict,
    confidence,
    realScore,
    fakeScore,
    summaryExplanation,
    indicators,
    suspiciousSentences,
    keywords,
    analyzedAt: new Date().toISOString(),
    analysisMode: "local-heuristic-demo",
  };
}
