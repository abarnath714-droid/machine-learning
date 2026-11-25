import { FileSearch } from "lucide-react";
import AnalysisResultView from "../components/AnalysisResultView";
import DetectorWorkbench from "../components/DetectorWorkbench";
import { AnalysisReport } from "../types/news";

interface DetectPageProps {
  activeReport: AnalysisReport | null;
  onAnalysisComplete: (report: AnalysisReport) => void;
}

export default function DetectPage({
  activeReport,
  onAnalysisComplete,
}: DetectPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          AI News & URL Detection
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
          Paste news text or enter an article URL to classify it as Real, Fake, or Suspicious,
          inspect confidence scores, and review flagged sentences.
        </p>
      </div>

      <DetectorWorkbench onAnalysisComplete={onAnalysisComplete} />

      {activeReport ? (
        <AnalysisResultView report={activeReport} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <FileSearch className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Ready for Analysis
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Select one of the sample articles above, paste your own text, or enter a news URL to
            generate a complete credibility report and suspicion breakdown.
          </p>
        </div>
      )}
    </div>
  );
}
