import { FormEvent, useState } from "react";
import { AlertCircle, LogOut, ShieldCheck } from "lucide-react";
import { DemoUser, PageRoute } from "../types/news";
import { loginDemoAccount, registerDemoAccount } from "../utils/storage";

interface AuthPageProps {
  mode: "login" | "register";
  sessionUser: DemoUser | null;
  onAuthSuccess: (user: DemoUser) => void;
  onLogout: () => void;
  onNavigate: (route: PageRoute) => void;
}

export default function AuthPage({
  mode,
  sessionUser,
  onAuthSuccess,
  onLogout,
  onNavigate,
}: AuthPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (sessionUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Active Demo Session</h1>
              <p className="text-xs text-slate-500">Stored locally in browser localStorage</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>{" "}
              <strong className="text-slate-900">{sessionUser.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>{" "}
              <span className="text-slate-900">{sessionUser.email}</span>
            </div>
            <div>
              <span className="text-slate-500">Role:</span>{" "}
              <span className="text-slate-900">{sessionUser.role}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(sessionUser.role === "Admin" ? "admin" : "dashboard")}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Go to {sessionUser.role === "Admin" ? "Admin Console" : "Dashboard"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === "register") {
      if (name.trim().length < 2) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      const res = registerDemoAccount({ name, email, password });
      if (res.error || !res.user) {
        setErrorMsg(res.error || "Unable to register demo account.");
        return;
      }
      onAuthSuccess(res.user);
      return;
    }

    const res = loginDemoAccount(email, password);
    if (res.error || !res.user) {
      setErrorMsg(res.error || "Invalid credentials.");
      return;
    }
    onAuthSuccess(res.user);
  };

  const handleQuickDemoLogin = (demoEmail: string, demoPass: string) => {
    setErrorMsg(null);
    const res = loginDemoAccount(demoEmail, demoPass);
    if (res.user) {
      onAuthSuccess(res.user);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-700">
            Local Demo Authentication
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Sign in to VeritasLens" : "Create a Demo Account"}
          </h1>
          <p className="text-xs text-slate-500">
            Demo session state is saved locally in your browser without an external database.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alex Rivera"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="analyst@veritaslens.demo"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            {mode === "login" ? "Sign In" : "Create Demo Account"}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="text-xs font-medium text-slate-500">
            Quick Demo Sign-In
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("analyst@veritaslens.demo", "demo1234")}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("admin@veritaslens.demo", "admin1234")}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-600">
          {mode === "login" ? (
            <>
              Need a local demo profile?{" "}
              <button
                type="button"
                onClick={() => onNavigate("register")}
                className="font-semibold text-blue-700 hover:text-blue-800 underline cursor-pointer"
              >
                Register here
              </button>
            </>
          ) : (
            <>
              Already have a demo profile?{" "}
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="font-semibold text-blue-700 hover:text-blue-800 underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
