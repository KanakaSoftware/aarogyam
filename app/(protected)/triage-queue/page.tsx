"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Users, 
    Search, 
    Filter, 
    RefreshCcw, 
    Plus,
    Activity,
    Clock,
    UserPlus
} from "lucide-react";
import { useState } from "react";
import { TriageQueueTable } from "@/components/triage/TriageQueueTable";
import Link from "next/link";
import clsx from "clsx";

export default function TriageQueuePage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: queue, isLoading, isFetching } = useQuery({
        queryKey: ["triage-queue"],
        queryFn: async () => {
            const res = await fetch("/api/triage");
            if (!res.ok) throw new Error("Failed to fetch triage queue");
            return res.json();
        },
        refetchInterval: 30000 // Refetch every 30 seconds for real-time feel
    });

    const acceptMutation = useMutation({
        mutationFn: async (id: string) => {
            // Get current user (doctor)
            const userRes = await fetch("/api/auth/me"); // Assuming this exists or getting from session
            const user = await userRes.json();

            const res = await fetch(`/api/triage/${id}/assign`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ doctor_id: user.id })
            });
            if (!res.ok) throw new Error("Failed to accept patient");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triage-queue"] });
        }
    });

    const filteredQueue = queue?.filter((item: any) => 
        item.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.priority.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: queue?.length || 0,
        critical: queue?.filter((i: any) => i.priority === 'CRITICAL').length || 0,
        high: queue?.filter((i: any) => i.priority === 'HIGH').length || 0,
        averageWait: queue?.length 
            ? Math.floor(queue.reduce((acc: number, curr: any) => 
                acc + (new Date().getTime() - new Date(curr.created_at).getTime()), 0) / (queue.length * 60000))
            : 0
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Triage Queue</h1>
                    <p className="text-slate-500 mt-1">Real-time patient prioritization and physician assignment.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["triage-queue"] })}
                        className={clsx(
                            "p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-all",
                            isFetching && "animate-spin"
                        )}
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <Link
                        href="/triage/new"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        Assess New Patient
                    </Link>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Patients in Queue" value={stats.total} icon={Users} color="blue" />
                <StatCard label="Critical Alerts" value={stats.critical} icon={Activity} color="rose" alert={stats.critical > 0} />
                <StatCard label="High Priority" value={stats.high} icon={Clock} color="orange" />
                <StatCard label="Avg. Wait Time" value={`${stats.averageWait}m`} icon={Clock} color="slate" />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter queue by patient name or priority..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-50 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <TriageQueueTable 
                    data={filteredQueue || []} 
                    isLoading={isLoading} 
                    onAccept={async (id) => {
                        await acceptMutation.mutateAsync(id);
                    }}
                />
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, alert }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        rose: "bg-rose-50 text-rose-600",
        orange: "bg-orange-50 text-orange-600",
        slate: "bg-slate-50 text-slate-600"
    };

    return (
        <div className="bg-white p-6 rounded-[28px] border-2 border-slate-50 shadow-sm flex items-center gap-4">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
                <Icon className={clsx("w-6 h-6", alert && "animate-bounce")} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
