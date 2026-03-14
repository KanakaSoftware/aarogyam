"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    patientName: string;
    appointmentDate: string;
}

export function DeleteAppointmentModal({
    isOpen,
    onClose,
    onConfirm,
    patientName,
    appointmentDate,
}: DeleteAppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Failed to delete appointment:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="p-6 pb-0 flex flex-col items-center text-center">
                    <div className="p-4 bg-rose-50 rounded-full mb-4">
                        <AlertTriangle className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                            Cancel Appointment?
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">
                            <span className="text-slate-900 font-bold">{patientName}</span>'s session on <span className="text-slate-900 font-bold">{appointmentDate}</span> will be removed.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        Are you sure you want to cancel and delete this appointment? This action is permanent and will clear the slot for other patients.
                    </p>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-2 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                        Keep It
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-sm shadow-rose-500/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Confirm Deletion"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
