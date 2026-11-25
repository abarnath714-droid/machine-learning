import { useState } from "react";
import { ArrowRight, FileSearch, Globe, ShieldCheck } from "lucide-react";
import DetectorWorkbench from "../components/DetectorWorkbench";
import { PLATFORM_SAMPLE_STATS } from "../data/sampleData";
import { AnalysisReport, PageRoute } from "../types/news";

interface HomePageProps {
  onAnalysisComplete: (report: AnalysisReport) => void;
  onNavigate: (route: PageRoute) => void;
}

export default function HomePage({
  onAnalysisComplete,
  onNavigate,
}: HomePageProps) {
  const [heroImgError, setHeroImgError] = useState(false);

  const scrollToAnalyzer = () => {
    const el = document.getElementById("home-analyzer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div>
      {/* Dark Editorial Hero Section */}
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium text-blue-400 tracking-wide">
                AI News Verification & Linguistic Diagnostics
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12] text-balance">
                Verify news claims with transparent, sentence-level AI analysis.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                VeritasLens inspects pasted articles and public news URLs to classify reporting
                as Real, Suspicious, or Fake—highlighting unverified assertions, sensational
                framing, and missing attributions without guessing.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate("detect")}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={scrollToAnalyzer}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  <span>Analyse News Below</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-64 sm:h-80 lg:h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_editorial_desk_1795579826308.jpg"
                    alt="Investigative news verification desk with digital document analysis display"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
                    <ShieldCheck className="w-12 h-12 text-blue-400 mb-3" />
                    <p className="text-sm font-semibold text-white">
                      VeritasLens Verification Desk
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Credibility scoring and sentence inspection
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-column sample statistics strip below hero split */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_SAMPLE_STATS.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-200">{stat.label}</div>
                <div className="text-xs text-slate-400">{stat.context}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instant News Detection Input Section */}
      <section
        id="home-analyzer"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Instant News Credibility Check
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Test an excerpt, paste a full report, or extract content directly from an article URL.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("history")}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 self-start md:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Saved History
          </button>
        </div>

        <DetectorWorkbench onAnalysisComplete={onAnalysisComplete} compact />
      </section>

      {/* Editorial 3-Step Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              How VeritasLens Evaluates Reporting
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Every classification separates verifiable attribution from rhetorical manipulation,
              giving readers clear reasons rather than opaque scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 border-t border-slate-100">
            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <Globe className="w-4 h-4" />
                <span>01. Text & URL Ingestion</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Submit raw article copy or provide a public link. Our extractor isolates clean
                editorial paragraphs and strips navigation noise before analysis.
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <FileSearch className="w-4 h-4" />
                <span>02. Six-Factor Credibility Audit</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The model checks for sensational headlines, misleading statements, unverified claims,
                missing citations, emotional exaggeration, and internal contradictions.
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>03. Sentence-Level Explanation</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Suspicious sentences are highlighted inline with concrete explanations—and archived
                automatically in your browser history for future review.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
