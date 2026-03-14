"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X, Loader2, User, Stethoscope, MapPin } from "lucide-react";
import { Appointment, AppointmentType, User as AppUser } from "@/types";

interface EditAppointmentModalProps {
    appointment: Appointment;
    onClose: () => void;
}

export function EditAppointmentModal({
    appointment,
    onClose,
}: EditAppointmentModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        appointment_type: appointment.appointment_type,
        room: appointment.room || "",
        doctor_id: appointment.doctor_id,
    });

    const { data: doctors } = useQuery<AppUser[]>({
        queryKey: ["doctors"],
        queryFn: async () => {
            const res = await fetch("/api/doctors");
            if (!res.ok) throw new Error("Failed to fetch doctors");
            return res.json();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch(`/api/appointments/${appointment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update appointment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onClose();
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Edit Details</h3>
                        <p className="text-xs text-slate-500 font-medium">Updating metadata for appointment #{appointment.id.substring(0,5).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Doctor Select */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Assigned Doctor</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4 h-4" /></span>
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                value={formData.doctor_id}
                                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                            >
                                <option value="">Select Doctor</option>
                                {doctors?.map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                         Dr. {doc.first_name} {doc.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Appt Type */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Appointment Type</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Stethoscope className="w-4 h-4" /></span>
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                value={formData.appointment_type}
                                onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as AppointmentType })}
                            >
                                <option value="CHECKUP">Checkup</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                                <option value="SURGERY">Surgery</option>
                                <option value="EMERGENCY">Emergency</option>
                            </select>
                        </div>
                    </div>

                    {/* Room */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Room / Location</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><MapPin className="w-4 h-4" /></span>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                placeholder="Consultation Room 3..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => updateMutation.mutate(formData)}
                        disabled={updateMutation.isPending}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
