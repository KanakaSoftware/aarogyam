"use client";

import { Activity, Heart, Thermometer, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface VitalsCardProps {
    label: string;
    value: string | number | undefined;
    unit: string;
    icon: any;
    status?: 'normal' | 'warning' | 'critical';
    className?: string;
}

export function VitalsCard({ label, value, unit, icon: Icon, status = 'normal', className }: VitalsCardProps) {
    const statusConfig = {
        normal: "bg-emerald-50 text-emerald-600 border-emerald-100",
        warning: "bg-amber-50 text-amber-600 border-amber-100",
        critical: "bg-rose-50 text-rose-600 border-rose-100"
    };

    return (
        <div className={clsx(
            "p-4 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4",
            statusConfig[status],
            className
        )}>
            <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                status === 'critical' ? "bg-rose-100" : "bg-white/50"
            )}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tracking-tight">
                        {value || "--"}
                    </span>
                    <span className="text-xs font-bold opacity-60 uppercase">{unit}</span>
                </div>
            </div>
            {status === 'critical' && (
                <div className="ml-auto animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                </div>
            )}
        </div>
    );
}
