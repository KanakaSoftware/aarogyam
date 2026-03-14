"use client";

import clsx from "clsx";
import { AlertTriangle, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface PriorityBadgeProps {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    const config = {
        LOW: {
            bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
            icon: <CheckCircle2 className="w-3 h-3" />,
            label: "Low Priority"
        },
        MEDIUM: {
            bg: "bg-blue-50 text-blue-700 border-blue-100",
            icon: <Clock className="w-3 h-3" />,
            label: "Medium"
        },
        HIGH: {
            bg: "bg-orange-50 text-orange-700 border-orange-100",
            icon: <AlertCircle className="w-3 h-3" />,
            label: "High Priority"
        },
        CRITICAL: {
            bg: "bg-rose-50 text-rose-700 border-rose-100 animate-pulse",
            icon: <AlertTriangle className="w-3 h-3" />,
            label: "Critical Alert"
        }
    };

    const current = config[priority] || config.LOW;

    return (
        <span className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm transition-all duration-300",
            current.bg,
            className
        )}>
            {current.icon}
            {current.label.toUpperCase()}
        </span>
    );
}
