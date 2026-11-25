import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DemoUser, PageRoute } from "../types/news";

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  sessionUser: DemoUser | null;
  onLogout: () => void;
}

const NAV_ITEMS: { id: PageRoute; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "detect", label: "Detect" },
  { id: "history", label: "History" },
  { id: "dashboard", label: "Dashboard" },
  { id: "about", label: "About" },
];

export default function Navbar({
  currentRoute,
  onNavigate,
  sessionUser,
  onLogout,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (route: PageRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  const isDashboardFamily = currentRoute === "dashboard" || currentRoute === "admin";

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav("home")}
          className="text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-blue-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 rounded-sm cursor-pointer"
        >
          VeritasLens
        </button>

        {/* Zone 2: 5 concise single-line text links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.id === "dashboard" ? isDashboardFamily : currentRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 rounded-sm ${
                  active
                    ? "text-white font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 -bottom-0.5 h-0.5 bg-blue-500 transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="hidden md:flex items-center shrink-0">
          {sessionUser ? (
            <button
              type="button"
              onClick={onLogout}
              title={`Signed in as ${sessionUser.name} (${sessionUser.role})`}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              Sign Out ({sessionUser.name.split(" ")[0]})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav("login")}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg focus-visible:outline-2 focus-visible:outline-blue-500 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active =
              item.id === "dashboard" ? isDashboardFamily : currentRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleNav("admin")}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentRoute === "admin"
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            Admin Console
          </button>
          <div className="pt-2 border-t border-slate-800">
            {sessionUser ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
              >
                Sign Out ({sessionUser.name})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNav("login")}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
