import { AdminSampleUser, SampleActivity } from "../types/news";

export interface SampleArticlePreset {
  id: string;
  label: string;
  expectedHint: "Real" | "Suspicious" | "Fake";
  title: string;
  text: string;
}

export const SAMPLE_ARTICLES: SampleArticlePreset[] = [
  {
    id: "sample_real",
    label: "Measured Science Report",
    expectedHint: "Real",
    title: "Coastal Cities Expand Tidal Barrier Monitoring After NOAA Tide Gauge Review",
    text: `Coastal Cities Expand Tidal Barrier Monitoring After NOAA Tide Gauge Review

Municipal engineering departments across three Atlantic port cities announced on Tuesday an expanded sensor network along existing seawalls following the release of the National Oceanic and Atmospheric Administration's annual coastal tide review.

According to data published by NOAA's Center for Operational Oceanographic Products and Services, high-tide flooding days along the mid-Atlantic coast rose modestly over the past decade, driven by regional sea-level trends and seasonal storm surges.

"Real-time water-level telemetry gives port operators an extra six to eight hours to close floodgates and reroute freight traffic," said Dr. Elena Alvarez, a civil engineering researcher at the University of Delaware who reviewed the municipal plan.

City officials noted that the $4.2 million sensor upgrade will be funded through existing harbor maintenance budgets and will publish hourly readings on a public dashboard starting in April.`,
  },
  {
    id: "sample_suspicious",
    label: "Unverified Health Claim",
    expectedHint: "Suspicious",
    title: "New Herbal Coffee Blend Reportedly Replaces Morning Blood Pressure Medication for Thousands",
    text: `New Herbal Coffee Blend Reportedly Replaces Morning Blood Pressure Medication for Thousands

A viral wellness post circulating widely on social media claims that an imported roasted root coffee blend can normalize high blood pressure within 72 hours, prompting questions from patients across the country.

According to posts shared by promoters of the drink, "insiders say" several European clinics quietly recommend switching away from daily prescriptions in favor of two cups of the blend each morning. No clinical trial numbers, hospital names, or peer-reviewed studies are cited in the circulating article.

While natural dietary changes can support cardiovascular health alongside medical supervision, cardiologists routinely warn against stopping prescribed hypertension medication without consulting a physician.`,
  },
  {
    id: "sample_fake",
    label: "Fabricated Viral Hoax",
    expectedHint: "Fake",
    title: "SHOCKING COVER-UP: Central Bank Secretly Shutting Down All ATMs Permanently Next Monday!",
    text: `SHOCKING COVER-UP: Central Bank Secretly Shutting Down All ATMs Permanently Next Monday!

BOMBSHELL LEAK: Anonymous whistleblowers inside the treasury have 100% PROVEN that every cash ATM in the country will be permanently disabled at midnight next Monday as part of an overnight currency wipeout that mainstream media refuses to report!

Sources say all physical bank notes will become worthless paper within 48 hours, yet the same memo later claims banks will still exchange paper bills through 2030. Citizens are urged to share this urgent warning immediately before the post is banned!`,
  },
];

export const PLATFORM_SAMPLE_STATS = [
  {
    label: "Sample Articles Screened",
    value: "14,820",
    context: "Curated benchmark corpus",
  },
  {
    label: "Suspicion Criteria Checked",
    value: "6",
    context: "Headline, claims, sources, tone",
  },
  {
    label: "Avg. Analysis Time",
    value: "1.8s",
    context: "Sentence-level breakdown",
  },
  {
    label: "Active Sample Analysts",
    value: "1,240",
    context: "Demo workspace dataset",
  },
];

export const WEEKLY_TREND_SAMPLE = [
  { day: "Mon", real: 34, suspicious: 18, fake: 12 },
  { day: "Tue", real: 42, suspicious: 22, fake: 15 },
  { day: "Wed", real: 39, suspicious: 27, fake: 19 },
  { day: "Thu", real: 51, suspicious: 20, fake: 14 },
  { day: "Fri", real: 47, suspicious: 25, fake: 18 },
  { day: "Sat", real: 29, suspicious: 16, fake: 11 },
  { day: "Sun", real: 36, suspicious: 19, fake: 13 },
];

export const INITIAL_ADMIN_USERS: AdminSampleUser[] = [
  {
    id: "adm_u1",
    name: "Maya Lin",
    email: "maya.lin@newsroom.demo",
    role: "Analyst",
    status: "Active",
    analysesCount: 48,
    joinedDate: "2026-06-14",
  },
  {
    id: "adm_u2",
    name: "Jordan Patel",
    email: "j.patel@civicmedia.demo",
    role: "Analyst",
    status: "Active",
    analysesCount: 31,
    joinedDate: "2026-07-22",
  },
  {
    id: "adm_u3",
    name: "Claire Moreau",
    email: "claire.m@presscheck.demo",
    role: "Member",
    status: "Active",
    analysesCount: 19,
    joinedDate: "2026-08-09",
  },
  {
    id: "adm_u4",
    name: "Tariq Al-Mansoor",
    email: "tariq@factdesk.demo",
    role: "Member",
    status: "Suspended",
    analysesCount: 7,
    joinedDate: "2026-09-01",
  },
  {
    id: "adm_u5",
    name: "Daniel Mercer",
    email: "admin@veritaslens.demo",
    role: "Admin",
    status: "Active",
    analysesCount: 64,
    joinedDate: "2026-05-03",
  },
];

export const INITIAL_SAMPLE_ACTIVITIES: SampleActivity[] = [
  {
    id: "act_101",
    userName: "Maya Lin",
    articleTitle: "Municipal Grid Operators Release Quarterly Solar Storage Report",
    sourceType: "URL",
    verdict: "Real",
    confidence: 91,
    status: "Reviewed",
    timestamp: "2026-11-24 18:40",
  },
  {
    id: "act_102",
    userName: "Jordan Patel",
    articleTitle: "Viral Post Claims New Toll Cameras Issue Fines Without Speed Limits",
    sourceType: "Text",
    verdict: "Fake",
    confidence: 88,
    status: "Flagged",
    timestamp: "2026-11-24 17:15",
  },
  {
    id: "act_103",
    userName: "Claire Moreau",
    articleTitle: "Unverified Leak Suggests Regional Rail Merger Before Year End",
    sourceType: "URL",
    verdict: "Suspicious",
    confidence: 74,
    status: "Pending",
    timestamp: "2026-11-24 15:52",
  },
  {
    id: "act_104",
    userName: "Daniel Mercer",
    articleTitle: "Central Bank Quarterly Inflation Bulletin Summarizes Core Trends",
    sourceType: "URL",
    verdict: "Real",
    confidence: 94,
    status: "Reviewed",
    timestamp: "2026-11-24 14:20",
  },
  {
    id: "act_105",
    userName: "Tariq Al-Mansoor",
    articleTitle: "Miracle Supplement Advertised as Complete Replacement for Insulin",
    sourceType: "Text",
    verdict: "Fake",
    confidence: 95,
    status: "Flagged",
    timestamp: "2026-11-24 11:05",
  },
];
