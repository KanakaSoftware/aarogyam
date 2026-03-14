"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { 
    Activity, 
    Thermometer, 
    Heart, 
    ClipboardList, 
    Search,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    Plus,
    X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { PainScaleSelector } from "./PainScaleSelector";
import { VitalsCard } from "./VitalsCard";

const COMMON_SYMPTOMS = [
    "Chest Pain", "Difficulty Breathing", "Fever", "Cough", "Headache", 
    "Dizziness", "Abdominal Pain", "Nausea", "Fatigue", "Sore Throat",
    "Rash", "Joint Pain", "Vomiting", "Diarrhea", "Confusion"
];

interface TriageFormValues {
    patient_id: string;
    symptoms: string[];
    temperature: string;
    heart_rate: string;
    blood_pressure_sys: string;
    blood_pressure_dia: string;
    pain_scale: number;
    notes: string;
}

interface TriageFormProps {
    onSuccess: () => void;
}

export function TriageForm({ onSuccess }: TriageFormProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<TriageFormValues>({
        defaultValues: {
            symptoms: [],
            pain_scale: 1
        }
    });

    const watchedSymptoms = watch("symptoms");
    const watchedVitals = {
        hr: watch("heart_rate"),
        bp_sys: watch("blood_pressure_sys"),
        temp: watch("temperature")
    };

    // Fetch patients
    const { data: patients, isLoading: isLoadingPatients } = useQuery({
        queryKey: ["patients-list"],
        queryFn: async () => {
            const res = await fetch("/api/patients?limit=100");
            const json = await res.json();
            return json.data || [];
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: TriageFormValues) => {
            const res = await fetch("/api/triage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    temperature: parseFloat(data.temperature),
                    heart_rate: parseInt(data.heart_rate),
                    blood_pressure_sys: parseInt(data.blood_pressure_sys),
                    blood_pressure_dia: parseInt(data.blood_pressure_dia)
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit triage");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triage-queue"] });
            onSuccess();
        },
        onError: (err: Error) => setServerError(err.message)
    });

    const toggleSymptom = (symptom: string) => {
        const current = watchedSymptoms || [];
        if (current.includes(symptom)) {
            setValue("symptoms", current.filter(s => s !== symptom));
        } else {
            setValue("symptoms", [...current, symptom]);
        }
    };

    const onSubmit = (data: TriageFormValues) => {
        setServerError(null);
        mutation.mutate(data);
    };

    // Vitals status logic
    const getVitalsStatus = (type: 'hr' | 'bp' | 'temp', value: string) => {
        if (!value) return 'normal';
        const num = parseFloat(value);
        if (isNaN(num)) return 'normal';

        if (type === 'hr') {
            if (num > 150 || num < 40) return 'critical';
            if (num > 100 || num < 60) return 'warning';
        }
        if (type === 'bp') {
            if (num > 180) return 'critical';
            if (num > 140) return 'warning';
        }
        if (type === 'temp') {
            if (num > 40) return 'critical';
            if (num > 37.5) return 'warning';
        }
        return 'normal';
    };

    const isCritical = 
        getVitalsStatus('hr', watchedVitals.hr) === 'critical' ||
        getVitalsStatus('bp', watchedVitals.bp_sys) === 'critical' ||
        getVitalsStatus('temp', watchedVitals.temp) === 'critical';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Patient Header Section */}
            <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                        <ClipboardList className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Assessment</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Select patient and record initial findings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Patient</label>
                        <select
                            {...register("patient_id", { required: "Patient selection is required" })}
                            className={clsx(
                                "w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-700 appearance-none",
                                errors.patient_id ? "border-rose-100" : "border-slate-50 hover:border-slate-100 focus:border-blue-500"
                            )}
                        >
                            <option value="">Select Patient...</option>
                            {patients?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Real-time Status Alert */}
                    <div className={clsx(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                        isCritical ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                            isCritical ? "bg-rose-100" : "bg-emerald-100"
                        )}>
                            {isCritical ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Engine Status</p>
                            <p className="text-sm font-bold tracking-tight">
                                {isCritical ? "CRITICAL RISK DETECTED" : "Normal Baseline Flow"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Symptoms & Pain */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Symptoms Multi-Select */}
                    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-500" />
                                Symptoms Multi-Select
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setValue("symptoms", [])}
                                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {COMMON_SYMPTOMS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSymptom(s)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                        watchedSymptoms?.includes(s)
                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                                            : "bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-200"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Additional Clinical Notes</label>
                            <textarea
                                {...register("notes")}
                                rows={4}
                                placeholder="Describe current state, duration of symptoms, and observed distress..."
                                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:border-slate-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Pain Scale */}
                    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm">
                        <Controller
                            control={control}
                            name="pain_scale"
                            render={({ field }) => (
                                <PainScaleSelector value={field.value} onChange={field.onChange} />
                            )}
                        />
                    </div>
                </div>

                {/* Right Column: Vitals */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-6 flex flex-col h-full">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-rose-500" />
                            Live Vitals Input
                        </h3>

                        <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <VitalsCard label="Temperature" value={watchedVitals.temp} unit="°C" icon={Thermometer} status={getVitalsStatus('temp', watchedVitals.temp)} />
                                <input {...register("temperature", { required: true })} type="number" step="0.1" className="w-full mt-2 px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-50 focus:border-rose-500 outline-none transition-all text-sm font-bold" placeholder="36.5" />
                            </div>

                            <div className="space-y-2">
                                <VitalsCard label="Heart Rate" value={watchedVitals.hr} unit="BPM" icon={Heart} status={getVitalsStatus('hr', watchedVitals.hr)} />
                                <input {...register("heart_rate", { required: true })} type="number" className="w-full mt-2 px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-50 focus:border-rose-500 outline-none transition-all text-sm font-bold" placeholder="72" />
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">BP (SYS)</label>
                                        <input {...register("blood_pressure_sys", { required: true })} type="number" className="w-full px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-50 focus:border-rose-500 outline-none transition-all text-sm font-bold" placeholder="120" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">BP (DIA)</label>
                                        <input {...register("blood_pressure_dia", { required: true })} type="number" className="w-full px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-50 focus:border-blue-500 outline-none transition-all text-sm font-bold" placeholder="80" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {serverError && (
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border-2 border-rose-100 flex items-center gap-3 animate-in shake duration-500">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="text-[10px] font-bold uppercase leading-tight">{serverError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full flex items-center justify-center gap-3 py-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    COMPLETE ASSESSMENT
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
