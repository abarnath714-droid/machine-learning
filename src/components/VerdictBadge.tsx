import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Verdict } from "../types/news";

interface VerdictBadgeProps {
  verdict: Verdict;
  size?: "sm" | "lg";
}

export default function VerdictBadge({ verdict, size = "sm" }: VerdictBadgeProps) {
  const styles =
    verdict === "Real"
      ? {
          container: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className={size === "lg" ? "w-5 h-5 text-emerald-700" : "w-4 h-4 text-emerald-700"} />,
          label: "Real News",
        }
      : verdict === "Suspicious"
      ? {
          container: "bg-amber-50 text-amber-900 border-amber-200",
          icon: <AlertTriangle className={size === "lg" ? "w-5 h-5 text-amber-700" : "w-4 h-4 text-amber-700"} />,
          label: "Suspicious",
        }
      : {
          container: "bg-rose-50 text-rose-900 border-rose-200",
          icon: <ShieldAlert className={size === "lg" ? "w-5 h-5 text-rose-700" : "w-4 h-4 text-rose-700"} />,
          label: "Fake News",
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-semibold whitespace-nowrap shrink-0 ${
        size === "lg" ? "px-3.5 py-1.5 text-sm rounded-lg" : "px-2.5 py-1 text-xs rounded-md"
      } ${styles.container}`}
    >
      {styles.icon}
      <span>{styles.label}</span>
    </span>
  );
}
