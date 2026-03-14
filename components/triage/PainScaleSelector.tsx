"use client";

import { useState } from "react";
import clsx from "clsx";

interface PainScaleSelectorProps {
    value?: number;
    onChange: (value: number) => void;
}

export function PainScaleSelector({ value, onChange }: PainScaleSelectorProps) {
    const scales = Array.from({ length: 10 }, (_, i) => i + 1);

    const getScaleColor = (num: number) => {
        if (num <= 3) return "bg-emerald-500 shadow-emerald-500/20";
        if (num <= 6) return "bg-amber-500 shadow-amber-500/20";
        if (num <= 8) return "bg-orange-600 shadow-orange-600/20";
        return "bg-rose-600 shadow-rose-600/20";
    };

    const getScaleLabel = (num: number) => {
        if (num === 1) return "Minimal";
        if (num === 5) return "Moderate";
        if (num === 10) return "Excruciating";
        return null;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pain Intensity (1-10)</span>
                {value && (
                    <span className={clsx(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase",
                        getScaleColor(value)
                    )}>
                        Level {value}
                    </span>
                )}
            </div>
            
            <div className="flex items-end justify-between gap-1 sm:gap-2">
                {scales.map((num) => (
                    <div key={num} className="flex-1 flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onChange(num)}
                            className={clsx(
                                "w-full transition-all duration-300 rounded-xl hover:scale-105 active:scale-95",
                                value === num 
                                    ? clsx("h-16 shadow-lg", getScaleColor(num)) 
                                    : "h-12 bg-slate-100 hover:bg-slate-200"
                            )}
                        />
                        <span className={clsx(
                            "text-[10px] font-bold transition-colors",
                            value === num ? "text-slate-900" : "text-slate-400"
                        )}>
                            {num}
                        </span>
                        {getScaleLabel(num) && (
                            <span className="absolute -bottom-6 text-[8px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                                {getScaleLabel(num)}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            <div className="pt-2" /> {/* Spacer for labels */}
        </div>
    );
}
