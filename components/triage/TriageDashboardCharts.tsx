"use client";

import clsx from "clsx";

interface ChartProps {
    data: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
        CRITICAL: number;
    };
}

export function TriageDashboardCharts({ data }: ChartProps) {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    
    const segments = [
        { key: 'LOW', label: 'Low', color: 'bg-emerald-500', value: data.LOW },
        { key: 'MEDIUM', label: 'Medium', color: 'bg-blue-500', value: data.MEDIUM },
        { key: 'HIGH', label: 'High', color: 'bg-orange-500', value: data.HIGH },
        { key: 'CRITICAL', label: 'Critical', color: 'bg-rose-500 font-bold', value: data.CRITICAL }
    ];

    return (
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Priority Distribution</h3>
            
            <div className="space-y-6">
                {/* Horizontal Bar Chart */}
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    {segments.map((s) => {
                        const width = (s.value / total) * 100;
                        if (width === 0) return null;
                        return (
                            <div 
                                key={s.key}
                                className={clsx(s.color, "h-full transition-all duration-1000 ease-out")}
                                style={{ width: `${width}%` }}
                            />
                        );
                    })}
                </div>

                {/* Legend & Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {segments.map((s) => (
                        <div key={s.key} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={clsx("w-2 h-2 rounded-full", s.color)} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-slate-900">{s.value}</span>
                                <span className="text-[10px] font-medium text-slate-400">({Math.round((s.value / total) * 100)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wait Time Trend Visualization (Simplified) */}
            <div className="pt-4 border-t border-slate-50 space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Clinical Volume Trend</h3>
                <div className="h-32 flex items-end justify-between gap-1">
                    {[40, 65, 30, 85, 55, 95, 70, 45, 90, 60, 80, 50].map((h, i) => (
                        <div 
                            key={i}
                            className="flex-1 bg-slate-50 rounded-t-lg relative group transition-all duration-500 hover:bg-blue-50"
                            style={{ height: `${h}%` }}
                        >
                            <div 
                                className="absolute bottom-0 w-full bg-blue-500/20 rounded-t-lg transition-all duration-700 delay-100" 
                                style={{ height: '0%' }} 
                                id={`bar-${i}`}
                            />
                            <style dangerouslySetInnerHTML={{ __html: `
                                #bar-${i} { animation: grow-up 1.5s ease-out forwards ${i * 0.1}s; }
                                @keyframes grow-up { to { height: 100%; } }
                            `}} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between px-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">08:00</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">12:00</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">16:00</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">20:00</span>
                </div>
            </div>
        </div>
    );
}
