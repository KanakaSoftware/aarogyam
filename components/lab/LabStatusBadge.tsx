import clsx from "clsx";
import { LabOrderStatus } from "@/types";

export function LabStatusBadge({ status }: { status: LabOrderStatus }) {
    const styles: Record<LabOrderStatus, { dot: string; text: string; bg: string }> = {
        ORDERED: { dot: "bg-slate-400", text: "text-slate-700", bg: "bg-slate-100" },
        SAMPLE_COLLECTED: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
        PROCESSING: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
        RESULT_UPLOADED: { dot: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
        DOCTOR_REVIEWED: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
        PATIENT_NOTIFIED: { dot: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50" },
    };

    const s = styles[status] || styles.ORDERED;
    
    // Convert SNAKE_CASE to Title Case
    const formattedStatus = status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return (
        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", s.bg, s.text)}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", s.dot)} />
            {formattedStatus}
        </span>
    );
}
