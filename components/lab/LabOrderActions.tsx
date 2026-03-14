"use client"

import { useState } from "react";
import { Eye, CheckCircle2, Beaker, Upload, ShieldCheck, Loader2, Pencil, Trash2, Bell } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LabOrderStatus } from "@/types";
import { UploadResultModal } from "./UploadResultModal";

interface Props {
    orderId: string;
    status: LabOrderStatus;
    role: string; // "doctor" | "lab_technician" | "admin" | etc
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function LabOrderActions({ orderId, status, role, onView, onEdit, onDelete }: Props) {
    const queryClient = useQueryClient();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Update Status Mutation
    const updateMutation = useMutation({
        mutationFn: async (newStatus: LabOrderStatus) => {
            const res = await fetch(`/api/lab-orders/${orderId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || err.error || "Failed to update status");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
            queryClient.invalidateQueries({ queryKey: ["lab-order", orderId] });
        }
    });

    // Upload Result Mutation
    const uploadMutation = useMutation({
        mutationFn: async (data: { result_file_url: string; result_notes?: string }) => {
            const res = await fetch(`/api/lab-results`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lab_order_id: orderId,
                    ...data
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || err.error || "Failed to upload result");
            }
            return res.json();
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
             queryClient.invalidateQueries({ queryKey: ["lab-order", orderId] });
        }
    });

    const isDoctor = role === "doctor" || role === "admin" || role === "specialist";
    const isTech = role === "lab_technician" || role === "admin";

    return (
        <div className="flex items-center gap-1.5">
            {/* Common Action */}
            {onView && (
                <button
                    onClick={onView}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </button>
            )}

            {onEdit && (
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Order"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            )}

            {onDelete && (
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Order"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {/* Technician Actions */}
            {isTech && status === "ORDERED" && (
                <button
                    onClick={() => updateMutation.mutate("SAMPLE_COLLECTED")}
                    disabled={updateMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Mark Sample Collected"
                >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
            )}

            {isTech && status === "SAMPLE_COLLECTED" && (
                <button
                    onClick={() => updateMutation.mutate("PROCESSING")}
                    disabled={updateMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Mark Processing"
                >
                     {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Beaker className="w-4 h-4" />}
                </button>
            )}

            {isTech && status === "PROCESSING" && (
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Upload Results"
                >
                    <Upload className="w-4 h-4" />
                </button>
            )}

            {isTech && (
                <UploadResultModal
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    onUpload={async (data) => {
                        await uploadMutation.mutateAsync(data);
                    }}
                    orderId={orderId}
                />
            )}

            {/* Doctor Actions */}
            {isDoctor && status === "RESULT_UPLOADED" && (
                <button
                    onClick={() => updateMutation.mutate("DOCTOR_REVIEWED")}
                    disabled={updateMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Approve & Mark Reviewed"
                >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <ShieldCheck className="w-4 h-4" />}
                </button>
            )}

            {isDoctor && status === "DOCTOR_REVIEWED" && (
                <button
                    onClick={() => updateMutation.mutate("PATIENT_NOTIFIED")}
                    disabled={updateMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Notify Patient"
                >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Bell className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}
