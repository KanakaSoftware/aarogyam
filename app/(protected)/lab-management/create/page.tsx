"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LabOrderForm, LabOrderFormData } from "@/components/lab/LabOrderForm";

export default function CreateLabOrderPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: async (data: LabOrderFormData) => {
            const res = await fetch("/api/lab-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create lab order");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
            router.push("/lab-management");
        },
        onError: (err: any) => {
            setError(err.message);
        }
    });

    const handleCreate = async (data: LabOrderFormData) => {
        await createMutation.mutateAsync(data);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/lab-management"
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        New Lab Order
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Initiate a diagnostic test request for a patient.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
                    {error}
                </div>
            )}

            <LabOrderForm
                mode="create"
                onSubmit={handleCreate}
                isSubmitting={createMutation.isPending}
            />
        </div>
    );
}
