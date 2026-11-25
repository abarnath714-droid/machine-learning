import { useState } from "react";
import { Cpu, Database, FileSearch, ShieldCheck } from "lucide-react";
import { PageRoute } from "../types/news";

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Intro Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
          <p className="text-xs font-semibold text-blue-700">
            About VeritasLens
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight text-balance">
            Explainable AI analysis for everyday news literacy.
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            VeritasLens is a lightweight, transparent fake news detection system designed to help
            readers, students, and journalists evaluate online reporting before sharing it. Instead
            of returning an opaque label, it breaks down the linguistic and attribution cues behind
            every classification.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate("detect")}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Try the News Detector
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-64 sm:h-80 lg:h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {!imgError ? (
              <img
                src="/src/assets/images/about_verification_pipeline_1795579826665.jpg"
                alt="Isometric architectural illustration of multi-layer semantic text verification"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-blue-50">
                <FileSearch className="w-10 h-10 text-blue-700 mb-2" />
                <p className="text-sm font-semibold text-slate-900">
                  VeritasLens NLP Pipeline
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Project Objectives
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Built around clarity, nuance, and practical verification workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div className="pt-3 space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              01. Distinguish Verified, Suspicious, and Fabricated Reporting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Classify news content into Real, Suspicious, or Fake with confidence and score
              breakdowns rather than forcing ambiguous articles into a binary pass/fail.
            </p>
          </div>
          <div className="pt-3 space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              02. Explain Why Content Needs Scrutiny
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Highlight exact sentences showing sensational framing, unverified claims, missing
              citations, or internal contradictions, while noting that missing sources alone do not
              prove fabrication.
            </p>
          </div>
          <div className="pt-3 space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              03. Support Both Direct Text and Public Article URLs
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Extract clean article paragraphs from accessible news URLs and show transparent error
              messages whenever a publisher blocks automated reading or sits behind a paywall.
            </p>
          </div>
          <div className="pt-3 space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              04. Zero-Config Local Persistence
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Store analysis reports and demo user sessions cleanly in browser localStorage so the
              system works immediately without external database setup.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works & Tech Stack */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-xl p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-white">
            How AI Fake News Detection Works
          </h2>
          <ol className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <li>
              <strong className="text-white">Step 1 — Content Normalization:</strong> Submitted
              text or URL-extracted paragraphs are cleaned of boilerplate navigation and ad text.
            </li>
            <li>
              <strong className="text-white">Step 2 — Linguistic & Claim Evaluation:</strong>{" "}
              The AI model evaluates six structured credibility dimensions—headline sensationalism,
              misleading framing, unverified claims, source attribution, emotional tone, and logical
              consistency.
            </li>
            <li>
              <strong className="text-white">Step 3 — Sentence Attribution & Scoring:</strong>{" "}
              Specific sentences driving suspicion are extracted verbatim so readers can inspect
              exact evidence alongside Real vs. Fake signal scores.
            </li>
          </ol>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Technologies Used</h2>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-3">
              <Cpu className="w-4 h-4 text-blue-700 mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">React 19 & TypeScript</div>
                <div className="text-xs text-slate-600">
                  Modular SPA architecture with typed reports and interactive dashboards.
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-700 mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">Google Gemini AI + Express</div>
                <div className="text-xs text-slate-600">
                  Server-side structured JSON credibility inference and Cheerio HTML extraction.
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Database className="w-4 h-4 text-blue-700 mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-slate-900">Tailwind CSS & localStorage</div>
                <div className="text-xs text-slate-600">
                  Responsive UI and client-side persistence with zero external database setup.
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
