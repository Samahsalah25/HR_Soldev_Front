import { AlertTriangle, Clock, FileWarning, Plane, X } from "lucide-react";
import { useState } from "react";

const iconMap = {
  warning: AlertTriangle,
  clock: Clock,
  document: FileWarning,
  ticket: Plane,
};

const colorMap = {
  red: "bg-red-50 border-red-200 text-red-800",
  amber: "bg-amber-50 border-amber-200 text-amber-800",
  blue: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([]);

  const visible = alerts.filter((_, i) => !dismissed.includes(i));
  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert, idx) => {
        const Icon = iconMap[alert.icon] || AlertTriangle;
        const color = colorMap[alert.color] || colorMap.amber;
        return (
          <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${color}`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{alert.message}</p>
            <button onClick={() => setDismissed(d => [...d, alerts.indexOf(alert)])}>
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
}