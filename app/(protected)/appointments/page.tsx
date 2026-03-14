"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    Plus,
    Search,
    CalendarDays,
    XCircle,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Filter,
    Pencil,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Appointment, AppointmentStatus } from "@/types";
import { RescheduleModal } from "@/components/appointments/RescheduleModal";
import { DeleteAppointmentModal } from "@/components/appointments/DeleteAppointmentModal";
import { EditAppointmentModal } from "@/components/appointments/EditAppointmentModal";

async function fetchAppointments() {
    const res = await fetch("/api/appointments");
    if (!res.ok) throw new Error("Failed to fetch appointments");
    return res.json();
}

/**
 * Native helper to format date without date-fns
 */
function formatDate(dateStr: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateStr));
}

function formatTime(dateStr: string) {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(dateStr));
}

export default function AppointmentsListPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const { data: appointments, isLoading, error } = useQuery<Appointment[]>({
        queryKey: ["appointments"],
        queryFn: fetchAppointments
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete appointment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setDeletingAppointment(null);
        }
    });

    const filteredAppointments = appointments?.filter(appt => {
        const matchesSearch =
            appt.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appt.doctors?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appt.doctors?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || appt.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: AppointmentStatus) => {
        switch (status) {
            case 'SCHEDULED': return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case 'CANCELLED': return "bg-rose-50 text-rose-700 border-rose-100";
            case 'RESCHEDULED': return "bg-amber-50 text-amber-700 border-amber-100";
            case 'COMPLETED': return "bg-slate-50 text-slate-600 border-slate-100";
            default: return "bg-slate-50 text-slate-600";
        }
    };

    const getStatusIcon = (status: AppointmentStatus) => {
        switch (status) {
            case 'SCHEDULED': return <CheckCircle2 className="w-3 h-3" />;
            case 'CANCELLED': return <XCircle className="w-3 h-3" />;
            case 'RESCHEDULED': return <Clock className="w-3 h-3" />;
            case 'COMPLETED': return <CheckCircle2 className="w-3 h-3 opacity-50" />;
            default: return <AlertCircle className="w-3 h-3" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointments</h1>
                    <p className="text-slate-500 mt-1">Manage patient schedules and doctor availability.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/appointments/calendar"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <CalendarDays className="w-4 h-4" />
                        Calendar View
                    </Link>
                    <Link
                        href="/appointments/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Appointment
                    </Link>
                </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patients or doctors..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 mr-2" />
                        <select
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="RESCHEDULED">Rescheduled</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Patient</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Doctor</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Room</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredAppointments?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-900 font-bold text-sm">No appointments found</p>
                                                <p className="text-slate-400 text-xs">Try adjusting your filters or search query.</p>
                                            </div>
                                            {searchQuery || statusFilter !== "ALL" ? (
                                                <button
                                                    onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    Clear all filters
                                                </button>
                                            ) : (
                                                <Link
                                                    href="/appointments/create"
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    Schedule your first appointment
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments?.map((appt) => (
                                    <tr key={appt.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                    {appt.patients?.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm">{appt.patients?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                                                Dr. {appt.doctors?.last_name || appt.doctors?.first_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{formatDate(appt.appointment_time)}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{formatTime(appt.appointment_time)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{appt.appointment_type.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {appt.room || "\u2014"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm",
                                                getStatusStyles(appt.status)
                                            )}>
                                                {getStatusIcon(appt.status)}
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {(appt.status === 'SCHEDULED' || appt.status === 'RESCHEDULED') && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingAppointment(appt)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                                            title="Edit Details"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedAppointment(appt)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                            title="Reschedule Time"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingAppointment(appt)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                            title="Cancel & Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/patients/${appt.patient_id}`}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                                    title="View Patient"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedAppointment && (
                <RescheduleModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}

            {deletingAppointment && (
                <DeleteAppointmentModal
                    isOpen={true}
                    onClose={() => setDeletingAppointment(null)}
                    onConfirm={async () => {
                        await deleteMutation.mutateAsync(deletingAppointment.id);
                    }}
                    patientName={deletingAppointment.patients?.name || "Patient"}
                    appointmentDate={new Date(deletingAppointment.appointment_time).toLocaleDateString()}
                />
            )}

            {editingAppointment && (
                <EditAppointmentModal
                    appointment={editingAppointment}
                    onClose={() => setEditingAppointment(null)}
                />
            )}
        </div>
    );
}
