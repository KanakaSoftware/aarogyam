"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
    X,
    Activity,
    Thermometer,
    Heart,
    Weight,
    CheckCircle2,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import clsx from "clsx";

interface TriageFormModalProps {
    intakeId: string;
    patientName: string;
    initialSymptoms?: string;
    onClose: () => void;
}

export function TriageFormModal({
    intakeId,
    patientName,
    initialSymptoms,
    onClose,
}: TriageFormModalProps) {
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            symptoms: initialSymptoms || "",
            vitals: {
                weight: "",
                hr: "",
                bp: "",
                temp: "",
            },
            notes: ""
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/intake/${intakeId}/triage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to perform triage");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triage-queue"] });
            onClose();
        },
        onError: (err: Error) => {
            setServerError(err.message);
        }
    });

    const onSubmit = (data: any) => {
        setServerError("");
        mutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Triage</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Assessing: <span className="text-slate-900">{patientName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                    {serverError && (
                        <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-2xl border border-rose-100 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            {serverError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Symptoms Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-poppins">Chief Complaint & Symptoms</label>
                            </div>
                            <textarea
                                {...register("symptoms", { required: "Symptoms are required for triage" })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none h-32 ring-offset-0"
                                placeholder="Confirmed symptoms and clinical observations..."
                            />
                            {errors.symptoms && <p className="text-xs text-rose-500 font-medium ml-1">{errors.symptoms.message as string}</p>}
                        </div>

                        {/* Vitals Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-poppins">Key Vitals</label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                                        <Weight className="w-3 h-3" /> Weight (kg)
                                    </span>
                                    <input {...register("vitals.weight")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="70" />
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                                        <Activity className="w-3 h-3" /> BP (mmHg)
                                    </span>
                                    <input {...register("vitals.bp")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="120/80" />
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                                        <Heart className="w-3 h-3" /> HR (bpm)
                                    </span>
                                    <input {...register("vitals.hr")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="72" />
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                                        <Thermometer className="w-3 h-3" /> Temp (&deg;C)
                                    </span>
                                    <input {...register("vitals.temp")} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="36.5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-poppins">Nurse Conclusion & Notes</label>
                        </div>
                        <textarea
                            {...register("notes")}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none h-20"
                            placeholder="Additional context for the assigned physician..."
                        />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 bg-slate-50/30 -mx-8 -mb-8 px-8 py-6">
                        <div className="flex items-center gap-3 text-slate-500">
                            <AlertTriangle className="w-4 h-4 text-emerald-500" />
                            <p className="text-[10px] font-medium leading-tight">Priority and Physician assignment will be<br />calculated automatically upon submission.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={mutation.isPending}
                                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-2xl transition-all font-poppins"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="inline-flex items-center gap-2 px-10 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 rounded-2xl hover:from-emerald-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-500/20 active:scale-95 font-poppins"
                            >
                                {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {mutation.isPending ? "Evaluating..." : "Complete Triage"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
