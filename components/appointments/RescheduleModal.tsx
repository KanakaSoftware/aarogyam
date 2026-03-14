"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Clock,
    Calendar,
    X,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useState } from "react";
import { Appointment } from "@/types";
import clsx from "clsx";

interface RescheduleModalProps {
    appointment: Appointment;
    onClose: () => void;
}

function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(dateStr));
}

function formatTime(dateStr: string) {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(dateStr));
}

export function RescheduleModal({ appointment, onClose }: RescheduleModalProps) {
    const queryClient = useQueryClient();
    const [newTime, setNewTime] = useState("");
    const [error, setError] = useState<string | null>(null);

    const rescheduleMutation = useMutation({
        mutationFn: async (time: string) => {
            const res = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_time: time })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to reschedule");
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onClose();
        },
        onError: (err: Error) => {
            setError(err.message);
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Reschedule Appointment</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
                                Patient: {appointment.patients?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                        <InfoIcon className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-blue-900">Current Schedule</p>
                            <p className="text-sm text-blue-700 mt-1">
                                {formatDate(appointment.appointment_time)} at <span className="font-bold">{formatTime(appointment.appointment_time)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select New Time</label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="datetime-local"
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                value={newTime}
                                onChange={(e) => {
                                    setNewTime(e.target.value);
                                    setError(null);
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-white transition-all"
                    >
                        Keep Original
                    </button>
                    <button
                        onClick={() => rescheduleMutation.mutate(newTime)}
                        disabled={!newTime || rescheduleMutation.isPending}
                        className="flex-[1.5] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {rescheduleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm New Time"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
