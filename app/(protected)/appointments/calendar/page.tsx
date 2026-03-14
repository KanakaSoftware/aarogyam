"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Stethoscope,
    Clock,
    CheckCircle2,
    XCircle,
    Info
} from "lucide-react";
import { useState } from "react";
import { Appointment } from "@/types";
import clsx from "clsx";
import Link from "next/link";

/**
 * Native Date Helpers
 */
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

export default function AppointmentsCalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { data: appointments, isLoading } = useQuery<Appointment[]>({
        queryKey: ["appointments", "calendar", currentMonth.getFullYear(), currentMonth.getMonth()],
        queryFn: async () => {
            const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
            const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const res = await fetch(`/api/appointments/calendar?start=${start}&end=${end}`);
            if (!res.ok) throw new Error("Failed to fetch calendar data");
            return res.json();
        }
    });

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const getAppointmentsForDay = (date: Date) => {
        return appointments?.filter(appt => isSameDay(new Date(appt.appointment_time), date)) || [];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return "bg-emerald-500";
            case 'CANCELLED': return "bg-rose-500";
            case 'RESCHEDULED': return "bg-amber-500";
            case 'COMPLETED': return "bg-slate-400";
            default: return "bg-blue-500";
        }
    };

    // Calculate calendar days
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Previous month padding
    const prevMonthDays = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        prevMonthDays.push(new Date(year, month - 1, prevMonthLastDate - i));
    }

    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push(new Date(year, month, i));
    }

    // Next month padding
    const nextMonthDays = [];
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDaysSoFar; // 6 rows of 7
    for (let i = 1; i <= remainingDays; i++) {
        nextMonthDays.push(new Date(year, month + 1, i));
    }

    const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Calendar</h1>
                    <p className="text-slate-500 mt-1">Visual schedule of all medical appointments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/appointments"
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        List View
                    </Link>
                    <Link
                        href="/appointments/create"
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                    >
                        Add Appointment
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-900">{formatDate(currentMonth, { month: 'long', year: 'numeric' })}</h2>
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 text-slate-400 border-r border-slate-100"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">Today</button>
                                <button onClick={nextMonth} className="p-2 hover:bg-slate-50 text-slate-400 border-l border-slate-100"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 border-collapse">
                        {allCalendarDays.map((day) => {
                            const dayAppts = getAppointmentsForDay(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());
                            const isOtherMonth = day.getMonth() !== currentMonth.getMonth();

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={clsx(
                                        "min-h-[120px] p-2 border-r border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer relative",
                                        isOtherMonth && "bg-slate-50/30 text-slate-300",
                                        isToday && "bg-blue-50/30",
                                        isSelected && "ring-2 ring-inset ring-slate-900/10 z-10"
                                    )}
                                >
                                    <span className={clsx(
                                        "inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full mb-1",
                                        isToday ? "bg-slate-900 text-white" : "text-slate-600"
                                    )}>
                                        {day.getDate()}
                                    </span>

                                    <div className="space-y-1">
                                        {dayAppts.slice(0, 3).map(appt => (
                                            <div
                                                key={appt.id}
                                                className={clsx(
                                                    "w-full px-1.5 py-0.5 rounded text-[8px] font-bold text-white truncate shadow-sm",
                                                    getStatusColor(appt.status)
                                                )}
                                            >
                                                {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appt.appointment_time))} - {appt.patients?.name}
                                            </div>
                                        ))}
                                        {dayAppts.length > 3 && (
                                            <div className="text-[8px] font-bold text-slate-400 pl-1">
                                                + {dayAppts.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 min-h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{formatDate(selectedDate, { month: 'long', day: 'numeric' })}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{formatDate(selectedDate, { weekday: 'long' })}</p>

                        <div className="space-y-4">
                            {getAppointmentsForDay(selectedDate).length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Info className="w-5 h-5 text-slate-200" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">No appointments scheduled.</p>
                                </div>
                            ) : (
                                getAppointmentsForDay(selectedDate).map(appt => (
                                    <div key={appt.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3 group hover:border-slate-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("w-2 h-2 rounded-full", getStatusColor(appt.status))}></div>
                                            <span className="text-xs font-bold text-slate-900">{new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(appt.appointment_time))}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-800">{appt.patients?.name}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                                <Stethoscope className="w-3 h-3" />
                                                Dr. {appt.doctors?.last_name || appt.doctors?.first_name}
                                            </div>
                                        </div>
                                        <div className="pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{appt.appointment_type}</span>
                                            <Link href={`/patients/${appt.patient_id}`} className="text-[8px] font-bold text-blue-600 hover:underline">View File</Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
