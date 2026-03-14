"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    User,
    Clock,
    Stethoscope,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2,
    ClipboardList,
    Play,
    Activity,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { IntakeState } from "@/types";

async function fetchDoctorAssignments() {
    const res = await fetch("/api/doctor/assigned-patients");
    if (!res.ok) throw new Error("Failed to fetch assignments");
    return res.json();
}

export function DoctorAssignedPatients() {
    const queryClient = useQueryClient();

    const { data: assignments, isLoading, error } = useQuery({
        queryKey: ["doctor-assignments"],
        queryFn: fetchDoctorAssignments,
        refetchInterval: 15000,
    });

    const transitionMutation = useMutation({
        mutationFn: async ({ intakeId, state, notes }: { intakeId: string, state: IntakeState, notes?: string }) => {
            const res = await fetch(`/api/intake/${intakeId}/state`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ state, notes }),
            });
            if (!res.ok) throw new Error("Failed to transition state");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["doctor-assignments"] });
        }
    });

    if (isLoading) return <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="p-4 text-center text-rose-500 text-sm">Error loading assignments.</div>;

    if (!assignments || assignments.length === 0) {
        return (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Stethoscope className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-slate-500 font-medium">No active patient consultations.</p>
                <p className="text-xs text-slate-400 mt-1">New assignments will appear here once triaged.</p>
            </div>
        );
    }

    const getStateAction = (state: IntakeState) => {
        switch (state) {
            case 'TRIAGED': return { label: 'Accept & Start Consultation', next: 'ASSIGNED_TO_DOCTOR', icon: Play, color: 'bg-blue-600' };
            case 'ASSIGNED_TO_DOCTOR': return { label: 'Perform Consultation', next: 'CONSULTED', icon: Stethoscope, color: 'bg-emerald-600' };
            case 'CONSULTED': return { label: 'Start Treatment', next: 'TREATMENT_STARTED', icon: Activity, color: 'bg-violet-600' };
            case 'TREATMENT_STARTED': return { label: 'Finalize & Complete', next: 'COMPLETED', icon: CheckCircle2, color: 'bg-slate-900' };
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {assignments.map((item: any) => {
                const action = getStateAction(item.current_state);
                return (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs ring-1 ring-slate-100">
                                    {item.patients.name.split(' ').map((n: any) => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900">{item.patients.name}</h4>
                                        <span className={clsx(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            item.priority === 'CRITICAL' ? "bg-rose-100 text-rose-700" :
                                                item.priority === 'HIGH' ? "bg-orange-100 text-orange-700" :
                                                    "bg-blue-100 text-blue-700"
                                        )}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 italic max-w-sm truncate">&ldquo;{item.patient_intake.symptoms}&rdquo;</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden md:block mr-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current State</p>
                                    <p className="text-xs font-bold text-slate-700">{item.current_state.replace(/_/g, ' ')}</p>
                                </div>

                                {action && (
                                    <button
                                        onClick={() => transitionMutation.mutate({ intakeId: item.intake_id, state: action.next as IntakeState })}
                                        disabled={transitionMutation.isPending}
                                        className={clsx(
                                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50",
                                            action.color
                                        )}
                                    >
                                        {transitionMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <action.icon className="w-3.5 h-3.5" />}
                                        {action.label}
                                    </button>
                                )}

                                <Link
                                    href={`/patients/${item.patient_id}`}
                                    className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100 hover:border-slate-200 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
