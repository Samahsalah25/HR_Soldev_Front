import { WORKFLOW_STATUS_COLORS, WORKFLOW_STEPS } from "@/lib/loanUtils";
import { Check } from "lucide-react";

export default function LoanWorkflowBadge({ status, showSteps = false }) {
  const badgeClass = WORKFLOW_STATUS_COLORS[status] || "bg-gray-100 text-gray-600";

  if (!showSteps) {
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>{status}</span>;
  }

  const activeIdx = WORKFLOW_STEPS.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, idx) => {
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 transition-all
              ${done ? "bg-green-500 border-green-500 text-white" : active ? "bg-orange-500 border-orange-500 text-white" : "bg-background border-border text-muted-foreground"}`}>
              {done ? <Check className="w-3 h-3" /> : idx + 1}
            </div>
            <span className={`text-xs hidden sm:block ${active ? "text-orange-600 font-semibold" : done ? "text-green-600" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {idx < WORKFLOW_STEPS.length - 1 && <div className={`w-4 h-0.5 ${done ? "bg-green-400" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}