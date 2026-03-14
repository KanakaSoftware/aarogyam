"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Zap, 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    AlertCircle, 
    ShieldCheck,
    ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { RuleEditorModal } from "@/components/admin/RuleEditorModal";
import { PriorityBadge } from "@/components/triage/PriorityBadge";
import Link from "next/link";
import clsx from "clsx";

export default function AdminTriageRulesPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingRule, setEditingRule] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: rules, isLoading } = useQuery({
        queryKey: ["triage-rules"],
        queryFn: async () => {
            const res = await fetch("/api/triage-rules");
            if (!res.ok) throw new Error("Failed to fetch rules");
            return res.json();
        }
    });

    const mutation = useMutation({
        mutationFn: async ({ id, data }: { id?: string; data: any }) => {
            const res = await fetch(id ? `/api/triage-rules/${id}` : "/api/triage-rules", {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to save rule");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triage-rules"] });
            setEditingRule(null);
            setIsCreateModalOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/triage-rules/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete rule");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triage-rules"] });
        }
    });

    const filteredRules = rules?.filter((r: any) => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Protocol Engine</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Protocols</h1>
                    <p className="text-slate-500 mt-1">Manage institutional triage logic and automated routing systems.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-xl shadow-slate-200 hover:brightness-110 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    New Protocol
                </button>
            </header>

            <div className="space-y-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search protocols by name or specialty..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-50 bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Definition</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Outcome</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Department</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredRules?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No protocols found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredRules?.map((rule: any) => (
                                    <tr key={rule.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                    {rule.name}
                                                    {!rule.is_active && (
                                                        <span className="text-[8px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter italic">Disabled</span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-sm mt-1">
                                                    Conditions: {rule.conditions?.map((c: any) => `${c.type} ${c.operator || 'is'} ${c.value}`).join(' AND ')}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <PriorityBadge priority={rule.priority} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                {rule.department}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingRule(rule)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteMutation.mutate(rule.id)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(isCreateModalOpen || editingRule) && (
                <RuleEditorModal
                    rule={editingRule}
                    onClose={() => { setEditingRule(null); setIsCreateModalOpen(false); }}
                    onSave={async (data) => {
                        await mutation.mutateAsync({ id: editingRule?.id, data });
                    }}
                />
            )}
        </div>
    );
}
