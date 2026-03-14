"use client"

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";

export interface LabOrderFormData {
    patient_id: string;
    doctor_id: string;
    test_name: string;
    notes?: string;
}

interface Props {
    initialData?: Partial<LabOrderFormData>;
    onSubmit: (data: LabOrderFormData) => Promise<void>;
    isSubmitting: boolean;
    mode: "create" | "edit";
}

export function LabOrderForm({ initialData, onSubmit, isSubmitting, mode }: Props) {
    const { register, handleSubmit, formState: { errors } } = useForm<LabOrderFormData>({
        defaultValues: initialData,
    });

    // Fetch patients and doctors for the dropdowns
    const { data: patients, isLoading: isLoadingPatients } = useQuery({
        queryKey: ["patients-list"],
        queryFn: async () => {
            const res = await fetch("/api/patients?limit=100");
            if (!res.ok) throw new Error("Failed to load patients");
            const json = await res.json();
            return json.data || [];
        },
        enabled: mode === "create" // Only needed on create to select a patient
    });

    const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ["doctors-list"],
        queryFn: async () => {
            const res = await fetch("/api/doctors");
            if (!res.ok) throw new Error("Failed to load doctors");
            return res.json();
        },
        enabled: mode === "create" // Only needed on create
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">
                        {mode === "create" ? "Order Details" : "Edit Order Information"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Fill in the required information to {mode === "create" ? "submit a new lab test" : "update this lab order"}.
                    </p>
                </div>
                
                <div className="p-6 space-y-6">
                    {mode === "create" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Patient Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Patient <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <select
                                        {...register("patient_id", { required: "Patient selection is required" })}
                                        className={clsx(
                                            "block w-full pl-3 pr-10 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none",
                                            errors.patient_id ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
                                        )}
                                        disabled={isLoadingPatients}
                                    >
                                        <option value="">Select a patient</option>
                                        {patients?.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {isLoadingPatients && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                {errors.patient_id && <p className="text-xs text-rose-500 font-medium">{errors.patient_id.message}</p>}
                            </div>

                            {/* Doctor Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Ordering Doctor <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <select
                                        {...register("doctor_id", { required: "Doctor selection is required" })}
                                        className={clsx(
                                            "block w-full pl-3 pr-10 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none",
                                            errors.doctor_id ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
                                        )}
                                        disabled={isLoadingDoctors}
                                    >
                                        <option value="">Select a doctor</option>
                                        {doctors?.map((d: any) => (
                                            <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                                        ))}
                                    </select>
                                    {isLoadingDoctors && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                {errors.doctor_id && <p className="text-xs text-rose-500 font-medium">{errors.doctor_id.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Test Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Test Name <span className="text-rose-500">*</span></label>
                        <input
                            {...register("test_name", { required: "Test name is required" })}
                            type="text"
                            placeholder="e.g. Complete Blood Count (CBC)"
                            className={clsx(
                                "block w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                errors.test_name ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
                            )}
                        />
                        {errors.test_name && <p className="text-xs text-rose-500 font-medium">{errors.test_name.message}</p>}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Order Notes (Optional)</label>
                        <textarea
                            {...register("notes")}
                            rows={4}
                            placeholder="Add any specific instructions, symptoms, or clinical context for the lab..."
                            className="block w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                        />
                    </div>
                </div>
                
                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            mode === "create" ? "Create Lab Order" : "Save Changes"
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
