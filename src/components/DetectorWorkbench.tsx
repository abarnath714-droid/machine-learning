import { FormEvent, useState } from "react";
import { AlertCircle, FileText, Globe, Loader2, RotateCcw } from "lucide-react";
import { SAMPLE_ARTICLES } from "../data/sampleData";
import { AnalysisReport } from "../types/news";
import { runLocalHeuristicDemo } from "../utils/heuristicDemo";

interface DetectorWorkbenchProps {
  onAnalysisComplete: (report: AnalysisReport) => void;
  compact?: boolean;
}

export default function DetectorWorkbench({
  onAnalysisComplete,
  compact = false,
}: DetectorWorkbenchProps) {
  const [mode, setMode] = useState<"text" | "url">("text");
  const [titleInput, setTitleInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [extractedDomain, setExtractedDomain] = useState<string | undefined>(undefined);
  const [extractedUrl, setExtractedUrl] = useState<string | undefined>(undefined);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allowDemoFallback, setAllowDemoFallback] = useState(false);

  const handleLoadSample = (sampleId: string) => {
    const preset = SAMPLE_ARTICLES.find((s) => s.id === sampleId);
    if (!preset) return;
    setMode("text");
    setTitleInput(preset.title);
    setTextInput(preset.text);
    setUrlInput("");
    setExtractedDomain(undefined);
    setExtractedUrl(undefined);
    setErrorMsg(null);
    setAllowDemoFallback(false);
  };

  const handleReset = () => {
    setTitleInput("");
    setTextInput("");
    setUrlInput("");
    setExtractedDomain(undefined);
    setExtractedUrl(undefined);
    setErrorMsg(null);
    setAllowDemoFallback(false);
  };

  const runAiAnalysis = async (params: {
    text: string;
    title?: string;
    sourceUrl?: string;
    sourceDomain?: string;
  }) => {
    setLoadingStage("Analyzing linguistic signals, claims, and sources...");
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: params.text,
        title: params.title,
        sourceUrl: params.sourceUrl,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.code === "AI_KEY_MISSING" || data.code === "AI_AUTH_ERROR" || response.status >= 500) {
        setAllowDemoFallback(true);
      }
      throw new Error(data.error || "Unable to complete AI analysis.");
    }

    const report: AnalysisReport = {
      id: `rep_${Date.now()}`,
      title: data.inferredTitle || params.title || "Analyzed News Article",
      text: params.text,
      sourceUrl: params.sourceUrl,
      sourceDomain: params.sourceDomain,
      verdict: data.verdict,
      confidence: Math.round(Number(data.confidence) || 0),
      realScore: Math.round(Number(data.realScore) || 0),
      fakeScore: Math.round(Number(data.fakeScore) || 0),
      summaryExplanation: data.summaryExplanation || "",
      indicators: Array.isArray(data.indicators) ? data.indicators : [],
      suspiciousSentences: Array.isArray(data.suspiciousSentences)
        ? data.suspiciousSentences
        : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      analyzedAt: new Date().toISOString(),
      analysisMode: "gemini-ai",
    };

    onAnalysisComplete(report);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAllowDemoFallback(false);

    if (mode === "url") {
      const trimmedUrl = urlInput.trim();
      if (!trimmedUrl) {
        setErrorMsg("Please enter a news article URL starting with https:// or http://.");
        return;
      }

      setIsAnalyzing(true);
      setLoadingStage("Fetching and extracting article text from URL...");
      try {
        const extractRes = await fetch("/api/extract-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl }),
        });
        const extractData = await extractRes.json().catch(() => ({}));
        if (!extractRes.ok) {
          throw new Error(
            extractData.error || "Could not extract article text from this URL."
          );
        }

        setTitleInput(extractData.title || "");
        setTextInput(extractData.text || "");
        setExtractedDomain(extractData.domain);
        setExtractedUrl(extractData.url);

        await runAiAnalysis({
          text: extractData.text,
          title: extractData.title,
          sourceUrl: extractData.url,
          sourceDomain: extractData.domain,
        });
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to extract or analyze the URL."
        );
      } finally {
        setIsAnalyzing(false);
        setLoadingStage("");
      }
      return;
    }

    const trimmedText = textInput.trim();
    if (trimmedText.length < 40) {
      setErrorMsg(
        "Please paste or type at least 40 characters of news content so the model has enough context to evaluate."
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      await runAiAnalysis({
        text: trimmedText,
        title: titleInput.trim() || undefined,
        sourceUrl: extractedUrl,
        sourceDomain: extractedDomain,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "An error occurred during analysis."
      );
    } finally {
      setIsAnalyzing(false);
      setLoadingStage("");
    }
  };

  const handleRunHeuristicDemo = () => {
    if (textInput.trim().length < 40) {
      setErrorMsg("Paste at least 40 characters of news text to run the local heuristic demo.");
      return;
    }
    const demoReport = runLocalHeuristicDemo({
      text: textInput,
      title: titleInput.trim() || undefined,
      sourceUrl: extractedUrl,
      sourceDomain: extractedDomain,
    });
    setErrorMsg(null);
    setAllowDemoFallback(false);
    onAnalysisComplete(demoReport);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Verify News Content or Article URL
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Paste a headline and article body, or enter a public web URL for extraction.
          </p>
        </div>

        {/* Interactive Mode Switcher */}
        <div
          role="tablist"
          aria-label="Detection Input Mode"
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "text"}
            onClick={() => {
              setMode("text");
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "text"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "url"}
            onClick={() => {
              setMode("url");
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "url"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Article URL</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div className="pt-4 pb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Try sample:</span>
        {SAMPLE_ARTICLES.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleLoadSample(preset.id)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-4">
        {mode === "url" ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="article-url-input"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                News Article URL
              </label>
              <input
                id="article-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/news/regional-transit-report"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                We extract public HTML article paragraphs automatically. Paywalled or
                JavaScript-only pages may require pasting the article text directly.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!compact && (
              <div>
                <label
                  htmlFor="article-title-input"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Headline or Title <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="article-title-input"
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Enter the news headline..."
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="article-text-input"
                  className="block text-sm font-medium text-slate-700"
                >
                  News Article Content
                </label>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {textInput.trim().length} chars
                </span>
              </div>
              <textarea
                id="article-text-input"
                rows={compact ? 5 : 8}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the full news article, social post, or excerpt here for AI credibility and suspicion analysis..."
                className="w-full px-3.5 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y"
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-sm space-y-2.5"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-6">
              {mode === "url" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("text");
                    setErrorMsg(null);
                  }}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline cursor-pointer"
                >
                  Switch to Paste Text
                </button>
              )}
              {allowDemoFallback && mode === "text" && (
                <button
                  type="button"
                  onClick={handleRunHeuristicDemo}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  Run Local Heuristic Demo (Offline Fallback)
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleReset}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === "url" ? "Extracting & Analyzing..." : "Analyzing News..."}</span>
              </>
            ) : (
              <span>{mode === "url" ? "Extract & Analyse URL" : "Analyse News"}</span>
            )}
          </button>
        </div>

        {isAnalyzing && loadingStage && (
          <p className="text-xs text-slate-500 text-right">{loadingStage}</p>
        )}
      </form>
    </div>
  );
}
