"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    ArrowLeft,
    Check,
    Loader2,
    Search,
    AlertCircle,
    Building2,
    ClipboardList
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import { Patient, User as UserType, AppointmentType } from "@/types";

interface AppointmentForm {
    patient_id: string;
    doctor_id: string;
    appointment_time: string;
    appointment_type: AppointmentType;
    room?: string;
}

export default function CreateAppointmentPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<AppointmentForm>({
        defaultValues: {
            appointment_type: 'CHECKUP'
        }
    });

    const selectedType = watch("appointment_type");
    const selectedPatientId = watch("patient_id");

    // Fetch Patients
    const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
        queryKey: ["patients"],
        queryFn: async () => {
            const res = await fetch(`/api/patients?limit=100`);
            if (!res.ok) throw new Error("Failed to fetch patients");
            return res.json();
        }
    });

    // Fetch Doctors
    const { data: doctors, isLoading: isLoadingDoctors } = useQuery<UserType[]>({
        queryKey: ["doctors"],
        queryFn: async () => {
            const res = await fetch("/api/doctors");
            if (!res.ok) throw new Error("Failed to fetch doctors");
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: AppointmentForm) => {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to create appointment");
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            router.push("/appointments");
        }
    });

    const onSubmit = (data: AppointmentForm) => {
        createMutation.mutate(data);
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center gap-4">
                <Link href="/appointments" className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Appointment</h1>
                    <p className="text-slate-500 mt-1">Schedule a new visit for a patient.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden min-h-[600px]">
                <div className="p-8 space-y-8">
                    {/* Patient Selection Dropdown */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Select Patient</h3>
                        </div>

                        <div className="relative">
                            <select
                                {...register("patient_id", { required: true })}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                                disabled={isLoadingPatients}
                                defaultValue=""
                            >
                                <option value="" disabled>{isLoadingPatients ? "Loading Patients..." : "Select a Patient"}</option>
                                {patientsData?.data?.map((patient: Patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name} {patient.phone ? `(${patient.phone})` : ""}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                {isLoadingPatients ? <Loader2 className="w-4 h-4 text-slate-300 animate-spin" /> : <Search className="w-4 h-4 text-slate-300" />}
                            </div>
                        </div>

                        {errors.patient_id && <p className="text-rose-500 text-xs font-bold mt-2">Patient selection is required.</p>}
                        {patientsData?.data?.length === 0 && !isLoadingPatients && (
                            <p className="text-amber-600 text-[10px] font-bold uppercase tracking-tight">No patients found. Please create a patient first.</p>
                        )}
                    </section>

                    <hr className="border-slate-100" />

                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest">
                                    <Stethoscope className="w-4 h-4 text-emerald-500" />
                                    Doctor
                                </label>
                                <select
                                    {...register("doctor_id", { required: true })}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:opacity-50 transition-all"
                                    disabled={isLoadingDoctors}
                                >
                                    <option value="">{isLoadingDoctors ? "Loading Doctors..." : "Select a Doctor"}</option>
                                    {doctors?.map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            Dr. {doc.first_name} {doc.last_name} ({doc.role})
                                        </option>
                                    ))}
                                </select>
                                {errors.doctor_id && <p className="text-rose-500 text-xs font-bold">Doctor selection is required.</p>}
                                {doctors?.length === 0 && !isLoadingDoctors && (
                                    <p className="text-amber-600 text-[10px] font-bold uppercase tracking-tight">No doctors available. Check roles assignment.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    Time
                                </label>
                                <input
                                    type="datetime-local"
                                    {...register("appointment_time", { required: true })}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                                />
                                {errors.appointment_time && <p className="text-rose-500 text-xs font-bold">Appointment time is required.</p>}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest">
                                    <ClipboardList className="w-4 h-4 text-purple-500" />
                                    Type
                                </label>
                                <select
                                    {...register("appointment_type", { required: true })}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                                >
                                    <option value="CHECKUP">Checkup</option>
                                    <option value="FOLLOW_UP">Follow Up</option>
                                    <option value="SURGERY">Surgery</option>
                                    <option value="EMERGENCY">Emergency</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest">
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                    Room
                                </label>
                                <input
                                    type="text"
                                    placeholder={selectedType === 'SURGERY' ? "e.g. Operating Room A" : "e.g. Room 302"}
                                    {...register("room", {
                                        required: selectedType === 'SURGERY' ? "Room is required for surgery" : false,
                                        validate: (val) => {
                                            if (selectedType === 'SURGERY' && (!val || !val.toLowerCase().includes('operating'))) {
                                                return "Surgery must be in an Operating Room";
                                            }
                                            return true;
                                        }
                                    })}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                />
                                {errors.room && <p className="text-rose-500 text-xs font-bold">{errors.room.message as string}</p>}
                                {selectedType === 'SURGERY' && <p className="text-[10px] uppercase font-bold text-blue-500 px-1 mt-1 tracking-wider">Required for Surgery</p>}
                            </div>
                        </section>
                    </div>

                    {createMutation.isError && (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 animate-in shake-200 duration-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-bold">{(createMutation.error as Error).message}</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Link href="/appointments" className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all">Cancel</Link>
                    <button
                        type="submit"
                        disabled={createMutation.isPending || !selectedPatientId}
                        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule Appointment"}
                    </button>
                </div>
            </form>
        </div>
    );
}
