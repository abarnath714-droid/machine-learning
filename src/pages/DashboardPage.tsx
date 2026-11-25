import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import VerdictBadge from "../components/VerdictBadge";
import { WEEKLY_TREND_SAMPLE } from "../data/sampleData";
import {
  AdminSampleUser,
  AnalysisReport,
  DemoUser,
  PageRoute,
  SampleActivity,
} from "../types/news";
import {
  loadAdminSampleActivities,
  loadAdminSampleUsers,
  saveAdminSampleActivities,
  saveAdminSampleUsers,
} from "../utils/storage";

interface DashboardPageProps {
  initialMode: "user" | "admin";
  history: AnalysisReport[];
  sessionUser: DemoUser | null;
  onSelectReport: (report: AnalysisReport) => void;
  onNavigate: (route: PageRoute) => void;
}

function VerdictDonutChart({
  real,
  suspicious,
  fake,
  centerLabel,
}: {
  real: number;
  suspicious: number;
  fake: number;
  centerLabel: string;
}) {
  const total = real + suspicious + fake;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-44">
        <div className="text-center space-y-1">
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-300">0</div>
          <div className="text-xs text-slate-500">No articles analyzed yet</div>
        </div>
      </div>
    );
  }

  const realLen = (real / total) * circumference;
  const suspLen = (suspicious / total) * circumference;
  const fakeLen = (fake / total) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="16"
          />
          {real > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#15803d"
              strokeWidth="16"
              strokeDasharray={`${realLen} ${circumference}`}
              strokeDashoffset={0}
            />
          )}
          {suspicious > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#b45309"
              strokeWidth="16"
              strokeDasharray={`${suspLen} ${circumference}`}
              strokeDashoffset={-realLen}
            />
          )}
          {fake > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#b91c1c"
              strokeWidth="16"
              strokeDasharray={`${fakeLen} ${circumference}`}
              strokeDashoffset={-(realLen + suspLen)}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
            {total}
          </span>
          <span className="text-[11px] text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700 inline-block" />
            Real News
          </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {real} ({Math.round((real / total) * 100)}%)
          </span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 inline-block" />
            Suspicious
          </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {suspicious} ({Math.round((suspicious / total) * 100)}%)
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-700 inline-block" />
            Fake News
          </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {fake} ({Math.round((fake / total) * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({
  initialMode,
  history,
  sessionUser,
  onSelectReport,
  onNavigate,
}: DashboardPageProps) {
  const [tab, setTab] = useState<"user" | "admin">(initialMode);

  // Admin dummy state backed by localStorage so actions persist across refreshes
  const [adminUsers, setAdminUsers] = useState<AdminSampleUser[]>(() =>
    loadAdminSampleUsers()
  );
  const [adminActivities, setAdminActivities] = useState<SampleActivity[]>(() =>
    loadAdminSampleActivities()
  );
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);

  const userStats = useMemo(() => {
    const real = history.filter((h) => h.verdict === "Real").length;
    const suspicious = history.filter((h) => h.verdict === "Suspicious").length;
    const fake = history.filter((h) => h.verdict === "Fake").length;
    return {
      total: history.length,
      real,
      suspicious,
      fake,
    };
  }, [history]);

  const adminStats = useMemo(() => {
    const baseTotalAnalyses = 1280 + adminActivities.length + history.length;
    const sampleReal = 640 + adminActivities.filter((a) => a.verdict === "Real").length + userStats.real;
    const sampleSuspicious =
      410 + adminActivities.filter((a) => a.verdict === "Suspicious").length + userStats.suspicious;
    const sampleFake =
      230 + adminActivities.filter((a) => a.verdict === "Fake").length + userStats.fake;

    return {
      totalUsers: 240 + adminUsers.length,
      activeUsers: adminUsers.filter((u) => u.status === "Active").length,
      totalAnalyses: baseTotalAnalyses,
      real: sampleReal,
      suspicious: sampleSuspicious,
      fake: sampleFake,
    };
  }, [adminUsers, adminActivities, history.length, userStats]);

  const handleToggleUserStatus = (id: string) => {
    const updated = adminUsers.map((u) =>
      u.id === id
        ? { ...u, status: (u.status === "Active" ? "Suspended" : "Active") as "Active" | "Suspended" }
        : u
    );
    setAdminUsers(updated);
    saveAdminSampleUsers(updated);
  };

  const handleCycleUserRole = (id: string) => {
    const roles: AdminSampleUser["role"][] = ["Member", "Analyst", "Admin"];
    const updated = adminUsers.map((u) => {
      if (u.id !== id) return u;
      const nextRole = roles[(roles.indexOf(u.role) + 1) % roles.length];
      return { ...u, role: nextRole };
    });
    setAdminUsers(updated);
    saveAdminSampleUsers(updated);
  };

  const handleAddSampleUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const added: AdminSampleUser = {
      id: `adm_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: "Analyst",
      status: "Active",
      analysesCount: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    const updated = [added, ...adminUsers];
    setAdminUsers(updated);
    saveAdminSampleUsers(updated);
    setNewUserName("");
    setNewUserEmail("");
    setShowAddUser(false);
  };

  const handleUpdateActivityStatus = (
    id: string,
    status: SampleActivity["status"]
  ) => {
    const updated = adminActivities.map((act) =>
      act.id === id ? { ...act, status } : act
    );
    setAdminActivities(updated);
    saveAdminSampleActivities(updated);
  };

  const handleDeleteActivity = (id: string) => {
    const updated = adminActivities.filter((act) => act.id !== id);
    setAdminActivities(updated);
    saveAdminSampleActivities(updated);
  };

  const maxWeeklyDay = Math.max(
    ...WEEKLY_TREND_SAMPLE.map((d) => d.real + d.suspicious + d.fake)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header + Workspace Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-xs font-medium text-slate-500">
            {sessionUser
              ? `Signed in as ${sessionUser.name} (${sessionUser.role})`
              : "Guest Preview · Local Session"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {tab === "user" ? "User Analytics Dashboard" : "Admin Oversight Console"}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div
            role="tablist"
            aria-label="Dashboard Workspace View"
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "user"}
              onClick={() => {
                setTab("user");
                onNavigate("dashboard");
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === "user"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              User Dashboard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "admin"}
              onClick={() => {
                setTab("admin");
                onNavigate("admin");
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === "admin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin Dashboard
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("detect")}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Analysis
          </button>
        </div>
      </div>

      {tab === "user" ? (
        <div className="space-y-8">
          {/* 4 KPI Cards (Real localStorage user totals) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">
                Total News Analysed
              </div>
              <div className="text-3xl font-mono font-bold tabular-nums text-slate-900 mt-2">
                {userStats.total}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Saved in browser history
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-emerald-700">
                Real News Count
              </div>
              <div className="text-3xl font-mono font-bold tabular-nums text-emerald-800 mt-2">
                {userStats.real}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Credible & attributed
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-amber-800">
                Suspicious News Count
              </div>
              <div className="text-3xl font-mono font-bold tabular-nums text-amber-900 mt-2">
                {userStats.suspicious}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Needs verification
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-rose-700">
                Fake News Count
              </div>
              <div className="text-3xl font-mono font-bold tabular-nums text-rose-800 mt-2">
                {userStats.fake}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                High manipulation signals
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Your Detection Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution across your saved analyses
                </p>
              </div>
              <VerdictDonutChart
                real={userStats.real}
                suspicious={userStats.suspicious}
                fake={userStats.fake}
                centerLabel="Analysed"
              />
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    7-Day Sample Benchmark Activity
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sample daily volume by classification category
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                    Real
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                    Suspicious
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" />
                    Fake
                  </span>
                </div>
              </div>

              <div className="h-44 flex items-end gap-3 sm:gap-5 pt-4">
                {WEEKLY_TREND_SAMPLE.map((day) => {
                  const totalDay = day.real + day.suspicious + day.fake;
                  const heightPct = Math.round((totalDay / maxWeeklyDay) * 100);
                  return (
                    <div
                      key={day.day}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {totalDay}
                      </span>
                      <div
                        className="w-full max-w-[38px] rounded-t-md overflow-hidden flex flex-col justify-end bg-slate-100"
                        style={{ height: `${Math.max(20, heightPct)}%` }}
                        title={`${day.day}: ${day.real} Real, ${day.suspicious} Suspicious, ${day.fake} Fake`}
                      >
                        <div
                          className="bg-rose-600 w-full"
                          style={{ height: `${(day.fake / totalDay) * 100}%` }}
                        />
                        <div
                          className="bg-amber-500 w-full"
                          style={{ height: `${(day.suspicious / totalDay) * 100}%` }}
                        />
                        <div
                          className="bg-emerald-600 w-full"
                          style={{ height: `${(day.real / totalDay) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Analysis History */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900">
                Recent Analysis History
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("history")}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                Open Full History
              </button>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-slate-800">
                  No personal analyses saved yet
                </p>
                <p className="text-xs text-slate-500">
                  Run your first check in the Detect workspace to populate your personal metrics.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("detect")}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Analyse an Article
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                      <th className="py-3 px-6">Title</th>
                      <th className="py-3 px-4">Verdict</th>
                      <th className="py-3 px-4 text-right">Confidence</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {history.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-6 max-w-md">
                          <div className="font-medium text-slate-900 truncate">
                            {item.title}
                          </div>
                          <div className="text-xs font-mono tabular-nums text-slate-400">
                            {new Date(item.analyzedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <VerdictBadge verdict={item.verdict} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                          {item.confidence}%
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectReport(item)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                          >
                            Open Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Admin Console */
        <div className="space-y-8">
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong>Sample Admin Workspace:</strong> Displays local demonstration user accounts,
              aggregated sample metrics, and interactive moderation controls stored in browser
              localStorage.
            </span>
            <span className="font-mono text-slate-400 shrink-0">No external DB connected</span>
          </div>

          {/* Admin KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Sample Total Users</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1.5">
                {adminStats.totalUsers}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Total News Analyses</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1.5">
                {adminStats.totalAnalyses}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-emerald-700">Real Reports</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-emerald-800 mt-1.5">
                {adminStats.real}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-amber-800">Suspicious</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-amber-900 mt-1.5">
                {adminStats.suspicious}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 col-span-2 lg:col-span-1">
              <div className="text-xs font-medium text-rose-700">Fake Reports</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-rose-800 mt-1.5">
                {adminStats.fake}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Platform Verdict Distribution */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Platform Verdict Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Combined sample baseline and current browser analyses
                </p>
              </div>
              <VerdictDonutChart
                real={adminStats.real}
                suspicious={adminStats.suspicious}
                fake={adminStats.fake}
                centerLabel="Total"
              />
            </div>

            {/* Recent Detection Activities (Moderation) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Detection Activities (Demo Moderation)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 px-4">Article & Analyst</th>
                      <th className="py-2.5 px-3">Verdict</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-4 text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminActivities.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-slate-900 truncate">
                            {act.articleTitle}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            {act.userName} · {act.sourceType} ·{" "}
                            <span className="font-mono tabular-nums">{act.timestamp}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <VerdictBadge verdict={act.verdict} />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                          {act.status}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateActivityStatus(act.id, "Reviewed")}
                              title="Mark Reviewed"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateActivityStatus(act.id, "Flagged")}
                              title="Flag for Review"
                              className="p-1.5 text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(act.id)}
                              title="Remove Sample Activity"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sample User Management */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Sample User Management
                </h2>
                <p className="text-xs text-slate-500">
                  Manage demo analyst roles, active statuses, or add a sample user record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUser((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sample User</span>
              </button>
            </div>

            {showAddUser && (
              <form
                onSubmit={handleAddSampleUser}
                className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg flex-1"
                />
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Save User
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Analyses</th>
                    <th className="py-3 px-6 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6">
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleCycleUserRole(u.id)}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline cursor-pointer"
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {u.status === "Active" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <UserCheck className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {u.analysesCount}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{u.status === "Active" ? "Suspend" : "Activate"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
