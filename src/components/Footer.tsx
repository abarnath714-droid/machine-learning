import { PageRoute } from "../types/news";

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-3">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="text-lg font-bold tracking-tight text-white cursor-pointer"
            >
              VeritasLens
            </button>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An AI-assisted news credibility and linguistic verification workbench built to help
              readers inspect claims, identify manipulative framing, and trace source attribution.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Workspace</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("detect")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  AI News Detection
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("history")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Detection History
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("dashboard")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  User Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("admin")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Admin Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Information</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About & Methodology
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("login")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Demo Sign In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("register")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Create Demo Account
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>VeritasLens · News Credibility & Suspicion Analysis Platform</p>
          <p>
            History and demo accounts are stored locally in your browser via localStorage.
          </p>
        </div>
      </div>
    </footer>
  );
}
