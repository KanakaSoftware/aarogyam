"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import clsx from "clsx";

interface DeletePatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    patientName: string;
}

export function DeletePatientModal({
    isOpen,
    onClose,
    onConfirm,
    patientName,
}: DeletePatientModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Failed to delete patient:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="p-6 pb-0 flex items-start gap-4">
                    <div className="p-3 bg-red-50 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                            Confirm Patient Deletion
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Archiving <span className="font-semibold text-slate-700">{patientName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-poppins">
                        Are you sure you want to delete this patient? This action will remove the patient from the active list but the data will be retained in the system for clinical auditing.
                    </p>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-slate-50 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-poppins"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 font-poppins"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Delete Patient"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
