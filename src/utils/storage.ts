import {
  AdminSampleUser,
  AnalysisReport,
  DemoUser,
  SampleActivity,
} from "../types/news";
import { INITIAL_ADMIN_USERS, INITIAL_SAMPLE_ACTIVITIES } from "../data/sampleData";

const HISTORY_KEY = "veritaslens_history_v1";
const USERS_KEY = "veritaslens_demo_users_v1";
const SESSION_KEY = "veritaslens_demo_session_v1";
const ADMIN_USERS_KEY = "veritaslens_admin_users_v1";
const ADMIN_ACTIVITIES_KEY = "veritaslens_admin_activities_v1";

export function loadHistory(): AnalysisReport[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReportToHistory(report: AnalysisReport): AnalysisReport[] {
  const existing = loadHistory().filter((item) => item.id !== report.id);
  const updated = [report, ...existing].slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteReportFromHistory(id: string): AnalysisReport[] {
  const updated = loadHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory(): AnalysisReport[] {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  return [];
}

interface StoredAccount extends DemoUser {
  password: string;
}

const DEFAULT_DEMO_ACCOUNTS: StoredAccount[] = [
  {
    id: "usr_demo_analyst",
    name: "Maya Lin",
    email: "analyst@veritaslens.demo",
    password: "demo1234",
    role: "User",
    createdAt: "2026-09-12T10:00:00.000Z",
  },
  {
    id: "usr_demo_admin",
    name: "Daniel Mercer",
    email: "admin@veritaslens.demo",
    password: "admin1234",
    role: "Admin",
    createdAt: "2026-08-03T09:30:00.000Z",
  },
];

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_DEMO_ACCOUNTS));
      return DEFAULT_DEMO_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEMO_ACCOUNTS;
  } catch {
    return DEFAULT_DEMO_ACCOUNTS;
  }
}

export function getDemoSession(): DemoUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function loginDemoAccount(
  email: string,
  password: string
): { user?: DemoUser; error?: string } {
  const accounts = getStoredAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  const found = accounts.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail && acc.password === password
  );

  if (!found) {
    return {
      error: "Invalid demo email or password. Try the quick demo sign-in buttons below.",
    };
  }

  const sessionUser: DemoUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    createdAt: found.createdAt,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return { user: sessionUser };
}

export function registerDemoAccount(params: {
  name: string;
  email: string;
  password: string;
}): { user?: DemoUser; error?: string } {
  const accounts = getStoredAccounts();
  const normalizedEmail = params.email.trim().toLowerCase();

  if (accounts.some((acc) => acc.email.toLowerCase() === normalizedEmail)) {
    return { error: "An account with this email already exists in local demo storage." };
  }

  const newAccount: StoredAccount = {
    id: `usr_${Date.now()}`,
    name: params.name.trim(),
    email: normalizedEmail,
    password: params.password,
    role: "User",
    createdAt: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts, newAccount];
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedAccounts));

  const sessionUser: DemoUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    role: newAccount.role,
    createdAt: newAccount.createdAt,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return { user: sessionUser };
}

export function logoutDemoAccount(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadAdminSampleUsers(): AdminSampleUser[] {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (!raw) return INITIAL_ADMIN_USERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ADMIN_USERS;
  } catch {
    return INITIAL_ADMIN_USERS;
  }
}

export function saveAdminSampleUsers(users: AdminSampleUser[]): void {
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
}

export function loadAdminSampleActivities(): SampleActivity[] {
  try {
    const raw = localStorage.getItem(ADMIN_ACTIVITIES_KEY);
    if (!raw) return INITIAL_SAMPLE_ACTIVITIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_ACTIVITIES;
  } catch {
    return INITIAL_SAMPLE_ACTIVITIES;
  }
}

export function saveAdminSampleActivities(activities: SampleActivity[]): void {
  localStorage.setItem(ADMIN_ACTIVITIES_KEY, JSON.stringify(activities));
}
