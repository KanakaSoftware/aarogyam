"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Patient } from "@/types";
import { CreatePatientInput } from "@/lib/validations/patient";
import { PatientStepperForm } from "@/components/patients/PatientStepperForm";

async function fetchPatient(id: string) {
    const res = await fetch(`/api/patients/${id}`);
    if (!res.ok) throw new Error("Failed to fetch patient");
    const data = await res.json();
    return data.patient as Patient;
}

async function updatePatient(id: string, data: CreatePatientInput) {
    const res = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update patient");
    }
    return res.json();
}

export default function EditPatientPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState("");

    const { data: patient, isLoading, error } = useQuery({
        queryKey: ["patient", id],
        queryFn: () => fetchPatient(id!),
        enabled: !!id,
    });

    // Format patient data for the form
    const initialData = useMemo(() => {
        if (!patient) return undefined;

        let formattedDob = "";
        if (patient.dob) {
            const dateObj = new Date(patient.dob);
            if (!isNaN(dateObj.getTime())) {
                formattedDob = dateObj.toISOString().split("T")[0];
            }
        }

        return {
            name: patient.name,
            dob: formattedDob,
            gender: patient.gender || "",
            phone: patient.phone || "",
            email: patient.email || "",
            insurance_details: patient.insurance_details || "",
            status: patient.status as any,
            assigned_doctor: patient.assigned_doctor || "",
            condition: patient.condition || "",
        } as Partial<CreatePatientInput>;
    }, [patient]);

    const mutation = useMutation({
        mutationFn: (data: CreatePatientInput) => updatePatient(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            queryClient.invalidateQueries({ queryKey: ["patient", id] });
            router.push("/patients");
            router.refresh();
        },
        onError: (error: Error) => {
            setServerError(error.message);
        },
    });

    const onSubmit = (data: CreatePatientInput) => {
        setServerError("");
        mutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-48 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading clinical record...</p>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="max-w-md mx-auto text-center py-32 space-y-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    <p className="font-bold">Patient Not Found</p>
                    <p className="text-sm mt-1">The record for PT-{id?.substring(0, 3).toUpperCase()} could not be retrieved.</p>
                </div>
                <Link href="/patients" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Registry
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Edit Patient Profile
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Update historical and clinical data for {patient.name}
                    </p>
                </div>
            </div>

            {serverError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {serverError}
                </div>
            )}

            <PatientStepperForm
                mode="edit"
                initialData={initialData}
                onSubmit={onSubmit}
                onCancel={() => router.back()}
                isLoading={mutation.isPending}
            />
        </div>
    );
}
