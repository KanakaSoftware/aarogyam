"use client"

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { LabOrderForm, LabOrderFormData } from "@/components/lab/LabOrderForm";
import { LabOrder } from "@/types";

import React from "react";

export default function EditLabOrderPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const router = useRouter();
    const id = params.id;
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const { data: order, isLoading: isLoadingOrder } = useQuery<LabOrder>({
        queryKey: ["lab-order", id],
        queryFn: async () => {
            const res = await fetch(`/api/lab-orders/${id}`);
            if (!res.ok) throw new Error("Failed to load order");
            return res.json();
        }
    });

    const editMutation = useMutation({
        mutationFn: async (data: LabOrderFormData) => {
            const res = await fetch(`/api/lab-orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    test_name: data.test_name,
                    notes: data.notes
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update lab order");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
            queryClient.invalidateQueries({ queryKey: ["lab-order", id] });
            router.push(`/lab-management/${id}`);
        },
        onError: (err: any) => {
            setError(err.message);
        }
    });

    const handleEdit = async (data: LabOrderFormData) => {
        await editMutation.mutateAsync(data);
    };

    if (isLoadingOrder) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-sm font-medium text-slate-500">Loading order details...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/lab-management/${id}`}
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Edit Lab Order
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Update test details or instructions for this request.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
                    {error}
                </div>
            )}

            <LabOrderForm
                mode="edit"
                initialData={{
                    patient_id: order.patient_id,
                    doctor_id: order.doctor_id,
                    test_name: order.test_name,
                    notes: order.notes || ""
                }}
                onSubmit={handleEdit}
                isSubmitting={editMutation.isPending}
            />
        </div>
    );
}
