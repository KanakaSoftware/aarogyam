"use client"

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, FileText, CheckCircle2, ShieldCheck, Loader2, Hospital, Mail as MailIcon, Phone, Calendar as CalendarIcon, Beaker } from "lucide-react";
import Link from "next/link";
import { LabOrder, LabResult } from "@/types";
import { LabStatusBadge } from "@/components/lab/LabStatusBadge";
import { LabOrderActions } from "@/components/lab/LabOrderActions";
import clsx from "clsx";

// Reusing same mock role hook
function useCurrentUserRole() {
    const { data } = useQuery({
        queryKey: ["current-user-role"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me");
            if (!res.ok) return { role: "admin" };
            const user = await res.json();
            return user;
        }
    });
    return data?.role || "admin";
}

import React from "react";

export default function LabOrderDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const router = useRouter();
    const role = useCurrentUserRole();
    const id = params.id;

    const { data: order, isLoading, isError, error: queryError } = useQuery<LabOrder>({
        queryKey: ["lab-order", id],
        queryFn: async () => {
            const res = await fetch(`/api/lab-orders/${id}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || err.error || "Failed to fetch lab order details");
            }
            return res.json();
        },
        enabled: !!id && id !== "undefined"
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-sm font-medium text-slate-500">Loading order details...</p>
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <ShieldCheck className="w-12 h-12 text-rose-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Order Not Found</h3>
                <p className="text-slate-500 mb-6">We couldn't track down this lab order.</p>
                <button onClick={() => router.push("/lab-management")} className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { patients, doctors, lab_results } = order;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/lab-management"
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Lab Order <span className="text-slate-400 font-normal">#{order.id.substring(0, 8).toUpperCase()}</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Ordered {new Date(order.ordered_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <LabStatusBadge status={order.status} />
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/lab-management/${order.id}/edit`}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Edit Order
                            </Link>
                            <LabOrderActions orderId={order.id} status={order.status} role={role} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info Cards */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Patient Info */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {patients?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{patients?.name || 'Unknown Patient'}</h3>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Patient</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                <MailIcon className="w-4 h-4 text-slate-400" />
                                {patients?.email || "No email"}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" />
                                {patients?.phone || "No phone"}
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Hospital className="w-4 h-4" /> Lab Routing Info
                            </h3>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Requested Test</p>
                                <p className="text-slate-900 font-bold flex items-center gap-2 text-wrap">
                                    <Beaker className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    {order.test_name}
                                </p>
                                {order.notes && (
                                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                                        {order.notes}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Originating Doctor</p>
                                <p className="text-slate-900 font-bold flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-500" />
                                    {doctors ? `Dr. ${doctors.first_name} ${doctors.last_name}` : 'Unknown Doctor'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Order Date</p>
                                <p className="text-slate-900 font-bold flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                                    {new Date(order.ordered_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Lab Results & Activity Flow */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Lab Results & Documents</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Uploaded reports and technical remarks.</p>
                        </div>
                        
                        <div className="p-6">
                            {!lab_results || lab_results.length === 0 ? (
                                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-semibold text-sm">No results uploaded yet</p>
                                    <p className="text-slate-400 text-xs mt-1">The lab technician has not provided the result document.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {lab_results.map((r: any) => (
                                        <div key={r.id} className="p-5 rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{r.report_name}</h4>
                                                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                                            Uploaded {new Date(r.uploaded_at).toLocaleString()} by {(r.uploader?.first_name || 'Technician')}
                                                        </p>
                                                        {r.result_notes && (
                                                            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100">
                                                                <span className="font-semibold text-slate-900 block mb-1">Technician Notes:</span>
                                                                {r.result_notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <a 
                                                    href={r.result_file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-800 transition-colors whitespace-nowrap"
                                                >
                                                    View File
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Workflow Progress (Visual Only) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-6">Workflow Progress</h3>
                        <div className="relative">
                            <div className="absolute top-4 left-4 h-[calc(100%-32px)] w-0.5 bg-slate-100" />
                            <div className="space-y-8 relative">
                                {[
                                    { key: "ORDERED", label: "Test Ordered", desc: "Doctor submitted lab request." },
                                    { key: "SAMPLE_COLLECTED", label: "Sample Collected", desc: "Patient lab samples acquired." },
                                    { key: "PROCESSING", label: "Processing", desc: "Lab is analyzing the samples." },
                                    { key: "RESULT_UPLOADED", label: "Result Uploaded", desc: "Report available for doctor review." },
                                    { key: "DOCTOR_REVIEWED", label: "Doctor Reviewed", desc: "Doctor has approved the results." },
                                    { key: "PATIENT_NOTIFIED", label: "Patient Notified", desc: "Results shared with the patient." }
                                ].map((step, idx) => {
                                    const allStatuses = ["ORDERED", "SAMPLE_COLLECTED", "PROCESSING", "RESULT_UPLOADED", "DOCTOR_REVIEWED", "PATIENT_NOTIFIED"];
                                    const currentIndex = allStatuses.indexOf(order.status);
                                    const stepIndex = allStatuses.indexOf(step.key);
                                    const isCompleted = currentIndex >= stepIndex;
                                    const isCurrent = currentIndex === stepIndex;

                                    return (
                                        <div key={step.key} className="flex gap-4">
                                            <div className="relative z-10 w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center shrink-0 shadow-sm shadow-slate-200"
                                                 style={{ backgroundColor: isCompleted ? '#3b82f6' : '#f1f5f9' }}
                                            >
                                                {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                                            </div>
                                            <div className="pt-1.5">
                                                <h4 className={clsx("text-sm font-bold", isCurrent ? "text-blue-600" : (isCompleted ? "text-slate-900" : "text-slate-400"))}>
                                                    {step.label}
                                                </h4>
                                                <p className="text-xs font-medium text-slate-500 mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Mobile Actions Overlay */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 sm:hidden flex justify-center gap-2">
                 <LabOrderActions orderId={order.id} status={order.status} role={role} />
            </div>
        </div>
    );
}
