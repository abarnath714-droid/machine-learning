import { Fragment, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import { AnalysisReport, SuspiciousSentence } from "../types/news";
import VerdictBadge from "./VerdictBadge";

interface AnalysisResultViewProps {
  report: AnalysisReport;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightedSegments(
  articleText: string,
  suspiciousSentences: SuspiciousSentence[]
): Array<{ text: string; match?: SuspiciousSentence; index: number }> {
  const validTargets = suspiciousSentences.filter(
    (s) => s.sentence && s.sentence.trim().length > 8
  );
  if (validTargets.length === 0) {
    return [{ text: articleText, index: -1 }];
  }

  const patternParts = validTargets
    .map((item) => escapeRegExp(item.sentence.trim()))
    .sort((a, b) => b.length - a.length);

  try {
    const regex = new RegExp(`(${patternParts.join("|")})`, "gi");
    const split = articleText.split(regex);
    return split
      .filter((part) => part.length > 0)
      .map((part) => {
        const idx = validTargets.findIndex(
          (item) => item.sentence.trim().toLowerCase() === part.toLowerCase()
        );
        return idx >= 0
          ? { text: part, match: validTargets[idx], index: idx }
          : { text: part, index: -1 };
      });
  } catch {
    return [{ text: articleText, index: -1 }];
  }
}

export default function AnalysisResultView({ report }: AnalysisResultViewProps) {
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(report.analyzedAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const segments = buildHighlightedSegments(report.text, report.suspiciousSentences);
  const presentIndicators = report.indicators.filter((ind) => ind.present);

  const handleCopySummary = async () => {
    const summaryText = `VeritasLens Report: ${report.title}\nVerdict: ${report.verdict} (${report.confidence}% confidence)\nReal Score: ${report.realScore}% | Fake Score: ${report.fakeScore}%\nExplanation: ${report.summaryExplanation}\nAnalyzed: ${formattedDate}`;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted iframe
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `veritaslens-report-${report.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Section 5: Structured Analysis Report */}
      <section
        aria-label="Analysis Report"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="bg-slate-950 text-white px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Analysis Report</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{formattedDate}</span>
              <span aria-hidden="true">·</span>
              <span>
                {report.analysisMode === "gemini-ai"
                  ? "Gemini AI Linguistic Model"
                  : "Local Heuristic Demonstration"}
              </span>
              {report.sourceDomain && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-400">{report.sourceDomain}</span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug text-balance">
              {report.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <VerdictBadge verdict={report.verdict} size="lg" />
            <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-right">
              <div className="text-[11px] text-slate-400">Prediction Confidence</div>
              <div className="text-base font-mono font-semibold tabular-nums text-white">
                {report.confidence}%
              </div>
            </div>
          </div>
        </div>

        {report.analysisMode === "local-heuristic-demo" && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Demonstration Mode:</strong> Generated by the local heuristic NLP scanner
              because the Gemini API service was unavailable.
            </span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Score Comparison + AI Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Credibility Score Breakdown
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Real News Signal Score</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-700">
                      {report.realScore}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, report.realScore))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Fake / Manipulation Signal Score</span>
                    <span className="font-mono tabular-nums font-semibold text-rose-700">
                      {report.fakeScore}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, report.fakeScore))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Active suspicion signals:{" "}
                  <strong className="font-mono tabular-nums text-slate-900">
                    {presentIndicators.length} / {report.indicators.length}
                  </strong>
                </span>
                {report.sourceUrl && (
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <span>Source Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3 lg:border-l lg:border-slate-100 lg:pl-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  AI Explanation Summary
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {report.summaryExplanation}
              </p>

              {/* Important Keywords */}
              {report.keywords.length > 0 && (
                <div className="pt-3">
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">
                    Important Keywords & Entities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {report.keywords.map((kw, idx) => (
                      <div
                        key={`${kw.term}-${idx}`}
                        className="flex items-baseline justify-between gap-2 py-1.5 border-b border-slate-100 text-xs"
                      >
                        <span className="font-mono font-semibold text-slate-900">
                          {kw.term}
                        </span>
                        <span className="text-slate-500 text-right truncate max-w-[65%]" title={kw.note}>
                          {kw.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Why Is This News Suspicious? */}
      <section
        aria-label="Why Is This News Suspicious"
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Why Is This News Suspicious?
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Detailed diagnostic across six journalistic credibility and linguistic manipulation factors.
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Note: Missing sources or emotional language alone do not automatically prove news is fake;
            treat flagged items as prompts for cross-verification.
          </p>
        </div>

        {/* 6 Suspicion Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.indicators.map((ind) => (
            <div
              key={ind.category}
              className={`p-4 rounded-lg border transition-colors ${
                ind.present
                  ? ind.severity === "high"
                    ? "bg-rose-50/50 border-rose-200"
                    : "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/60 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-900">
                  {ind.category}
                </span>
                {ind.present ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      ind.severity === "high" ? "text-rose-700" : "text-amber-800"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{ind.severity === "high" ? "High" : "Flagged"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ind.detail}</p>
            </div>
          ))}
        </div>

        {/* Highlighted Article Sentences + Sentence-by-Sentence Attention Notes */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Highlighted Article Inspection
              </h3>
              <span className="text-xs text-slate-500">
                {report.suspiciousSentences.length > 0
                  ? "Click a highlighted sentence to inspect its note"
                  : "No specific sentences flagged"}
              </span>
            </div>
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 leading-7 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {segments.map((seg, i) =>
                seg.match ? (
                  <mark
                    key={i}
                    onClick={() => setSelectedSentenceIdx(seg.index)}
                    className={`px-1 py-0.5 rounded cursor-pointer transition-colors ${
                      selectedSentenceIdx === seg.index
                        ? "bg-amber-300/90 text-slate-950 font-medium underline decoration-amber-700"
                        : "bg-amber-100 text-slate-900 hover:bg-amber-200 underline decoration-amber-500/70"
                    }`}
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <Fragment key={i}>{seg.text}</Fragment>
                )
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Sentences Needing Attention ({report.suspiciousSentences.length})
            </h3>

            {report.suspiciousSentences.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                No individual sentences triggered strong manipulation or unverified-claim alerts in
                this passage. Continue checking primary publication details as standard practice.
              </div>
            ) : (
              <div className="space-y-3">
                {report.suspiciousSentences.map((item, idx) => {
                  const isFocused = selectedSentenceIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSentenceIdx(idx)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        isFocused
                          ? "bg-amber-50 border-amber-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                        <span className="font-semibold text-amber-900">
                          {item.indicatorType}
                        </span>
                        <span className="font-mono tabular-nums text-slate-400">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 italic mb-1.5 line-clamp-2">
                        "{item.sentence}"
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.reason}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
