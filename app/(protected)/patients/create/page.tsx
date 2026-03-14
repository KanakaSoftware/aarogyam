"use client";

import { CreatePatientInput } from "@/lib/validations/patient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PatientStepperForm } from "@/components/patients/PatientStepperForm";

async function createPatient(data: CreatePatientInput) {
    const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create patient");
    }
    return res.json();
}

export default function CreatePatientPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState("");

    const mutation = useMutation({
        mutationFn: createPatient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patients"] });
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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/patients"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        New Patient Registration
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Complete all steps to register the patient in the system
                    </p>
                </div>
            </div>

            {serverError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 mb-6">
                    {serverError}
                </div>
            )}

            <PatientStepperForm
                mode="create"
                onSubmit={onSubmit}
                onCancel={() => router.push("/patients")}
                isLoading={mutation.isPending}
            />
        </div>
    );
}
