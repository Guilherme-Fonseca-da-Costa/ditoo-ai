import { Check, Loader2, AlertCircle } from "lucide-react";
import type { ActivityStep } from "../utils/activity";
import "../assets/processing-status.css";

export default function ProcessingStatus({ steps, active }: { steps: ActivityStep[]; active: boolean }) {
  if (!active || !steps.length) return null;
  const current = steps[steps.length - 1];
  const failed = current.stage === "error";
  const working = current.stage !== "complete" && !failed;
  return <div className="processing-status" role="status" aria-live="polite" aria-atomic="true">
    {working ? <Loader2 size={15} className="processing-spinner" aria-hidden="true" /> : failed ? <AlertCircle size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
    <span>{current.message}</span>
  </div>;
}
