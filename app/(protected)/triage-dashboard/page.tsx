"use client";

import { useQuery } from "@tanstack/react-query";
import { 
    Activity, 
    Users, 
    Clock, 
    ArrowUpRight,
    ArrowDownRight,
    LayoutDashboard,
    PieChart,
    BarChart3,
    Map
} from "lucide-react";
import { TriageDashboardCharts } from "@/components/triage/TriageDashboardCharts";
import clsx from "clsx";

export default function TriageDashboardPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["triage-stats"],
        queryFn: async () => {
            const res = await fetch("/api/triage/stats");
            if (!res.ok) throw new Error("Failed to fetch triage stats");
            return res.json();
        },
        refetchInterval: 60000 // Refetch every minute
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Intelligence</h1>
                    <p className="text-slate-500 mt-1">Real-time triage performance and clinical volume analytics.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Live System Monitoring</span>
                </div>
            </header>

            {/* Metrics Core Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    label="Avg Wait Time" 
                    value={`${stats?.avgQueueWait}m`} 
                    trend="-12%" 
                    trendUp={false} 
                    icon={Clock} 
                    color="blue" 
                />
                <MetricCard 
                    label="Volume Today" 
                    value={stats?.triagedToday} 
                    trend="+18%" 
                    trendUp={true} 
                    icon={Users} 
                    color="slate" 
                />
                <MetricCard 
                    label="Critical Response" 
                    value="4.2m" 
                    trend="-0.5m" 
                    trendUp={false} 
                    icon={Activity} 
                    color="rose" 
                />
                <MetricCard 
                    label="Throughput" 
                    value="84%" 
                    trend="+5%" 
                    trendUp={true} 
                    icon={ArrowUpRight} 
                    color="emerald" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <TriageDashboardCharts data={stats?.priorityCounts} />
                    
                    {/* Department Routing Table */}
                    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Map className="w-4 h-4 text-emerald-500" />
                                Department Routing Flow
                            </h3>
                            <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest transition-all">
                                View Full Report
                            </button>
                        </div>

                        <div className="space-y-4">
                            <DeptRow name="Emergency Care" count={12} percentage={45} color="bg-rose-500" />
                            <DeptRow name="Cardiology" count={4} percentage={15} color="bg-blue-500" />
                            <DeptRow name="General Medicine" count={8} percentage={30} color="bg-emerald-500" />
                            <DeptRow name="Pediatrics" count={3} percentage={10} color="bg-amber-500" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <LayoutDashboard className="w-32 h-32" />
                        </div>
                        <div className="relative">
                            <h4 className="text-xl font-bold mb-2">Shift Performance</h4>
                            <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                Your clinical team is currently operating at <span className="text-emerald-400 font-bold">Optimal Capacity</span>.
                            </p>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peak Volume Time</p>
                                    <p className="text-sm font-bold">14:30 - 16:00</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resource Efficiency</p>
                                    <p className="text-sm font-bold text-emerald-400">92.4%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Staffing Alert</h4>
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                             <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                             <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                 Wait times for <span className="font-bold">LOW</span> priority cases are increasing. Consider re-assigning one nurse to assessment.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, trend, trendUp, icon: Icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        rose: "bg-rose-50 text-rose-600",
        emerald: "bg-emerald-50 text-emerald-600",
        slate: "bg-slate-50 text-slate-600"
    };

    return (
        <div className="bg-white p-6 rounded-[28px] border-2 border-slate-50 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className={clsx(
                    "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold",
                    trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{value || "--"}</p>
            </div>
        </div>
    );
}

function DeptRow({ name, count, percentage, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{name}</span>
                <span className="text-[10px] font-bold text-slate-400">{count} Patients</span>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div 
                    className={clsx(color, "h-full transition-all duration-1000 ease-out")}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
