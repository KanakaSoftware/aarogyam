"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createPatientSchema,
    CreatePatientInput,
} from "@/lib/validations/patient";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, Calendar, Phone, Mail, Shield, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

interface PatientStepperFormProps {
    initialData?: Partial<CreatePatientInput>;
    onSubmit: (data: CreatePatientInput) => void;
    onCancel: () => void;
    isLoading: boolean;
    mode: "create" | "edit";
}

const STEPS = [
    { id: 1, label: "Personal Information", fields: ["name", "dob", "gender"] },
    { id: 2, label: "Contact Details", fields: ["phone", "email"] },
    { id: 3, label: "Medical Context", fields: ["assigned_doctor", "condition"] },
    { id: 4, label: "Insurance Information", fields: ["insurance_details"] },
    { id: 5, label: "Review & Status", fields: ["status"] },
] as const;

export function PatientStepperForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    mode,
}: PatientStepperFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [serverError, setServerError] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    // Fetch doctors from the admin users / doctors API
    const { data: doctors = [] } = useQuery<any[]>({
        queryKey: ["doctors"],
        queryFn: async () => {
            const res = await fetch("/api/doctors");
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 60_000,
        initialData: [],
    });

    const {
        register,
        handleSubmit,
        trigger,
        reset,
        formState: { errors, isValid },
    } = useForm<CreatePatientInput>({
        resolver: zodResolver(createPatientSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            dob: "",
            gender: "",
            phone: "",
            email: "",
            insurance_details: "",
            status: "active",
            assigned_doctor: "",
            condition: "",
            ...initialData,
        },
    });

    // Handle initialData updates (crucial for Edit mode)
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || "",
                dob: initialData.dob || "",
                gender: initialData.gender || "",
                phone: initialData.phone || "",
                email: initialData.email || "",
                insurance_details: initialData.insurance_details || "",
                status: (initialData.status as any) || "active",
                assigned_doctor: initialData.assigned_doctor || "",
                condition: initialData.condition || "",
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data: CreatePatientInput) => {
        // CRITICAL GUARD: Only allow submission if on the final step
        if (currentStep !== STEPS.length) return;

        setServerError("");
        onSubmit(data);
    };

    const nextStep = async () => {
        setIsValidating(true);
        try {
            const fields = STEPS[currentStep - 1].fields as unknown as (keyof CreatePatientInput)[];
            const isStepValid = await trigger(fields);
            if (isStepValid) {
                setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
            }
        } finally {
            setIsValidating(false);
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {/* Stepper Indicator */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8" />
                {STEPS.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center group">
                        <div
                            className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ring-4 ring-white",
                                currentStep === s.id
                                    ? "bg-blue-500 text-white scale-110 shadow-lg shadow-blue-100"
                                    : currentStep > s.id
                                        ? "bg-emerald-500 text-white"
                                        : "bg-slate-100 text-slate-400"
                            )}
                        >
                            {currentStep > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                        </div>
                        <span
                            className={clsx(
                                "text-[10px] mt-2 font-bold uppercase tracking-wider transition-colors duration-300",
                                currentStep === s.id ? "text-blue-600" : "text-slate-400"
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 min-h-[300px] flex flex-col justify-between">
                <div className="space-y-6">
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <User className="w-3.5 h-3.5" />
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    {...register("name")}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="Enter patient's full name"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-2">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Date of Birth <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    {...register("dob")}
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                />
                                {errors.dob && <p className="text-xs text-red-500 mt-2">{errors.dob.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Gender <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    {...register("gender")}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                                {errors.gender && <p className="text-xs text-red-500 mt-2">{errors.gender.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Details */}
                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    {...register("phone")}
                                    type="tel"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="+1 (555) 000-0000"
                                />
                                {errors.phone && <p className="text-xs text-red-500 mt-2">{errors.phone.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    Email Address
                                </label>
                                <input
                                    {...register("email")}
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="patient@email.com"
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-2">{errors.email.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Medical Context */}
                    {currentStep === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Assigned Doctor
                                </label>
                                <select
                                    {...register("assigned_doctor")}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">— No doctor assigned —</option>
                                    {doctors.map((doc) => {
                                        const namePart = [doc.first_name, doc.last_name].filter(Boolean).join(" ") || doc.email;
                                        const fullName = namePart.startsWith("Dr.") ? namePart : `Dr. ${namePart}`;
                                        return (
                                            <option key={doc.id} value={fullName}>
                                                {fullName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Medical Condition
                                </label>
                                <input
                                    {...register("condition")}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    placeholder="Initial diagnosis or symptoms"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Insurance Information */}
                    {currentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                <Shield className="w-3.5 h-3.5" />
                                Insurance Details
                            </label>
                            <input
                                {...register("insurance_details")}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                placeholder="Insurance Provider & Policy Number"
                            />
                        </div>
                    )}

                    {/* Step 5: Review & Status */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Final Status
                                </label>
                                <div className="flex gap-4">
                                    {["active", "critical", "discharged"].map((s) => (
                                        <label key={s} className="flex-1">
                                            <input
                                                type="radio"
                                                {...register("status")}
                                                value={s}
                                                className="sr-only peer"
                                            />
                                            <div className="text-center px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium cursor-pointer transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:bg-slate-50 capitalize">
                                                {s}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-900 mb-2">Ready to {mode === "create" ? "Register" : "Update"}?</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Please review the information provided. Once you click "{mode === "create" ? "Complete Registration" : "Update Patient"}", the changes will be saved to the clinical registry.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                        key="btn-prev"
                        type="button"
                        onClick={currentStep === 1 ? onCancel : prevStep}
                        disabled={isLoading || isValidating}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl disabled:opacity-30 transition-all font-poppins"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {currentStep === 1 ? "Cancel" : "Back"}
                    </button>

                    {currentStep < STEPS.length ? (
                        <button
                            key="btn-next"
                            type="button"
                            onClick={nextStep}
                            disabled={isValidating}
                            className="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100 font-poppins"
                        >
                            {isValidating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Next Step
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            key="btn-submit"
                            type="submit"
                            disabled={isLoading || !isValid}
                            className="inline-flex items-center gap-2 px-10 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 font-poppins"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            {isLoading ? (mode === "create" ? "Registering..." : "Updating...") : (mode === "create" ? "Complete Registration" : "Update Patient")}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
