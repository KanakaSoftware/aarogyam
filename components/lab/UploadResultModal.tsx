"use client"

import { useState } from "react";
import { X, UploadCloud, FileText, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useForm } from "react-hook-form";

interface UploadResultForm {
    report_name: string;
    result_file_url: string;
    result_notes?: string;
}

interface UploadResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: UploadResultForm) => Promise<void>;
    orderId: string;
}

export function UploadResultModal({ isOpen, onClose, onUpload, orderId }: UploadResultModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { register, handleSubmit, formState: { errors }, reset } = useForm<UploadResultForm>();

    if (!isOpen) return null;

    const onSubmit = async (data: UploadResultForm) => {
        try {
            setIsSubmitting(true);
            setError(null);
            await onUpload(data);
            reset();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred during upload");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pt-10 px-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm" 
                onClick={onClose}
                aria-hidden="true" 
            />

            {/* Modal Panel */}
            <div className="inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-[32px] animate-in fade-in zoom-in-95 duration-300">
                {/* Visual Header Banner */}
                <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <UploadCloud className="w-32 h-32 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                    <div className="relative px-8 h-full flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                Upload Result Report
                            </h3>
                            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                                Order ID: <span className="opacity-60">#{orderId.substring(0, 12).toUpperCase()}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                             {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Mock Drag & Drop Area */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex flex-col items-center justify-center py-10 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl group-hover:bg-white group-hover:border-blue-400 transition-all duration-300">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Select Report Document</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PDF, DOCX, or PNG up to 10MB</p>
                                <div className="mt-4 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                                    BROWSE FILES
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Report Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Report Display Name <span className="text-rose-500">*</span></label>
                                <input
                                    {...register("report_name", { required: "A professional report name is required" })}
                                    type="text"
                                    placeholder="e.g., Comprehensive Metabolic Panel"
                                    className={clsx(
                                        "block w-full px-4 py-3 text-sm border-2 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium",
                                        errors.report_name ? "border-rose-100 bg-rose-50/10" : "border-slate-50 hover:border-slate-100 focus:border-blue-500"
                                    )}
                                />
                                {errors.report_name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.report_name.message}</p>}
                            </div>

                            {/* File URL (Actual Functional Input) */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Document Link / URL <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        {...register("result_file_url", { required: "A valid document URL is required" })}
                                        type="url"
                                        placeholder="https://storage.clinic.com/reports/..."
                                        className={clsx(
                                            "block w-full px-4 py-3 text-sm border-2 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono",
                                            errors.result_file_url ? "border-rose-100 bg-rose-50/10" : "border-slate-50 hover:border-slate-100 focus:border-blue-500"
                                        )}
                                    />
                                </div>
                                {errors.result_file_url && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.result_file_url.message}</p>}
                            </div>
                        </div>

                        {/* Clinical Summary */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clinical Summary / Technician Notes</label>
                            <textarea
                                {...register("result_notes")}
                                rows={4}
                                placeholder="Provide a brief clinical context regarding the findings..."
                                className="block w-full p-4 text-sm border-2 border-slate-50 bg-white rounded-2xl shadow-sm hover:border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none font-medium"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                                disabled={isSubmitting}
                             >
                                DISCARD
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <UploadCloud className="w-5 h-5" />
                                        ARCHIVE REPORT
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
