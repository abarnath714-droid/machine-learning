import { useMemo, useState } from "react";
import { ArrowLeft, Eye, History, Search, Trash2 } from "lucide-react";
import AnalysisResultView from "../components/AnalysisResultView";
import VerdictBadge from "../components/VerdictBadge";
import { AnalysisReport, PageRoute, Verdict } from "../types/news";

interface HistoryPageProps {
  history: AnalysisReport[];
  onDeleteReport: (id: string) => void;
  onClearHistory: () => void;
  onNavigate: (route: PageRoute) => void;
}

export default function HistoryPage({
  history,
  onDeleteReport,
  onClearHistory,
  onNavigate,
}: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<"All" | Verdict>("All");
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      if (verdictFilter !== "All" && item.verdict !== verdictFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        (item.sourceDomain || "").toLowerCase().includes(q) ||
        item.keywords.some((k) => k.term.toLowerCase().includes(q))
      );
    });
  }, [history, searchQuery, verdictFilter]);

  if (selectedReport) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedReport(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Detection History</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDeleteReport(selectedReport.id);
              setSelectedReport(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Report</span>
          </button>
        </div>

        <AnalysisResultView report={selectedReport} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Detection History
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Saved locally in your browser. Inspect full reports, search keywords, or remove entries.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmClearAll ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setConfirmClearAll(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, domain, or keyword..."
            aria-label="Search detection history"
            className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto overflow-x-auto">
          {(["All", "Real", "Suspicious", "Fake"] as const).map((filterOpt) => (
            <button
              key={filterOpt}
              type="button"
              onClick={() => setVerdictFilter(filterOpt)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                verdictFilter === filterOpt
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {filterOpt}
            </button>
          ))}
        </div>
      </div>

      {/* History List / Empty States */}
      {history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            No Saved Analyses Yet
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Once you analyze an article or URL, the full report is automatically saved to your
            browser storage so you can revisit it anytime.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate("detect")}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Analyse First Article
            </button>
          </div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <p className="text-sm font-medium text-slate-900">
            No matching reports found
          </p>
          <p className="text-xs text-slate-500">
            Try clearing your search filter or switching the verdict tab.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Article Title & Source</th>
                  <th className="py-3 px-4 whitespace-nowrap">Result</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Confidence</th>
                  <th className="py-3 px-4 whitespace-nowrap">Date Analyzed</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-medium text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{item.sourceDomain || "Direct Text Input"}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.analysisMode === "gemini-ai" ? "Gemini AI" : "Demo Heuristic"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <VerdictBadge verdict={item.verdict} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {item.confidence}%
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {new Date(item.analyzedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReport(item.id)}
                          aria-label={`Delete report ${item.title}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
