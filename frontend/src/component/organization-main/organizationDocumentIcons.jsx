import { ClipboardList, FileChartColumn } from "lucide-react";

export function AnnualReportIcon({ className = "h-4 w-4" }) {
  return <FileChartColumn className={className} aria-hidden="true" />;
}

export function ActivityPlanIcon({ className = "h-4 w-4" }) {
  return <ClipboardList className={className} aria-hidden="true" />;
}
