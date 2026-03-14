"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { intakeSchema, IntakeInput } from "@/lib/validations/patient";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Shield,
    Calendar,
    Edit,
    Plus,
    History,
    FileText,
    FlaskConical,
    ClipboardList,
    Droplets,
    Ruler,
    Weight,
    Activity,
    Heart,
    Stethoscope,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Patient, PatientIntake, PatientStatus, AuditLog } from "@/types";
import clsx from "clsx";

async function fetchPatient(id: string) {
    const res = await fetch(`/api/patients/${id}`);
    if (!res.ok) throw new Error("Failed to fetch patient");
    return res.json();
}

async function fetchAuditLogs(id: string) {
    const res = await fetch(`/api/patients/${id}/audit-log`);
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
}

async function createIntake(patientId: string, data: IntakeInput & { submit?: boolean }) {
    const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, patientId }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create intake");
    }
    const intake = await res.json();

    // If submit is true, transition to SUBMITTED
    if (data.submit) {
        await fetch(`/api/intake/${intake.id}/state`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: "SUBMITTED", notes: "Initial submission from intake form" }),
        });
    }

    return intake;
}

function StatusBadge({ status }: { status: PatientStatus }) {
    const styles: Record<PatientStatus, { dot: string; text: string; bg: string }> = {
        active: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
        critical: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
        discharged: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
    };
    const s = styles[status] || styles.active;
    return (
        <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize", s.bg, s.text)}>
            <span className={clsx("w-2 h-2 rounded-full", s.dot)} />
            {status}
        </span>
    );
}

function VitalCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={clsx("p-1.5 rounded-lg", color)}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <span className="text-lg font-bold text-slate-900">{value}</span>
        </div>
    );
}

const TABS = [
    { name: "Overview", icon: User },
    { name: "Intake History", icon: History },
    { name: "Appointments", icon: Calendar },
    { name: "Treatment Plans", icon: FileText },
    { name: "Lab Results", icon: FlaskConical },
    { name: "Audit Log", icon: ClipboardList },
] as const;

type TabName = (typeof TABS)[number]["name"];

export default function PatientProfilePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabName>("Overview");
    const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["patient", id],
        queryFn: () => fetchPatient(id),
        enabled: !!id,
    });

    const patient: Patient | null = data?.patient ?? null;
    const intakeHistory: PatientIntake[] = data?.intakeHistory ?? [];

    const age = (() => {
        if (!patient?.dob) return null;
        const now = new Date();
        const dob = new Date(patient.dob);
        let a = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
        return a;
    })();

    const formatDate = (d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-48 gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin absolute inset-0" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">Fetching Profile</h3>
                    <p className="text-sm text-slate-500 mt-1">Retrieving clinical records for PT-{id.substring(0, 3).toUpperCase()}</p>
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="max-w-md mx-auto flex flex-col items-center justify-center py-32 gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center relative">
                    <User className="w-10 h-10 text-slate-200" />
                    <AlertCircle className="w-6 h-6 text-rose-500 absolute -bottom-1 -right-1 bg-white rounded-full border-4 border-white" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Not Found</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">The patient record you are looking for does not exist or has been permanently archived from the clinical registry.</p>
                </div>
                <Link href="/patients" className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 ring-4 ring-white">
                    <ArrowLeft className="w-4 h-4" />
                    Return to Patient Registry
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/patients")} className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
                            <StatusBadge status={patient.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider text-slate-600 uppercase">PT-{patient.id.substring(0, 3).toUpperCase()}</span>
                            <span>&middot; Registered {formatDate(patient.created_at)}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/patients/${patient.id}/edit`)} className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Edit className="w-4 h-4 text-slate-400" />
                        Edit Profile
                    </button>
                    <button
                        onClick={() => setIsIntakeModalOpen(true)}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 ring-4 ring-white ring-offset-0"
                    >
                        <Plus className="w-4 h-4" />
                        Record Intake
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/30 px-6">
                    <nav className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth" aria-label="Tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                                    activeTab === tab.name ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                                )}
                            >
                                <tab.icon className={clsx("w-4 h-4", activeTab === tab.name ? "text-blue-600" : "text-slate-400")} />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-8">
                    {activeTab === "Overview" && <OverviewTab patient={patient} age={age} intakeHistory={intakeHistory} formatDate={formatDate} />}
                    {activeTab === "Intake History" && <IntakeHistoryTab patientId={patient.id} intakeHistory={intakeHistory} formatDate={formatDate} />}
                    {activeTab === "Appointments" && <AppointmentsTab />}
                    {activeTab === "Treatment Plans" && <TreatmentPlansTab />}
                    {activeTab === "Lab Results" && <LabResultsTab />}
                    {activeTab === "Audit Log" && <AuditLogTab patientId={patient.id} />}
                </div>
            </div>

            {/* Record Intake Modal */}
            {isIntakeModalOpen && (
                <RecordIntakeModal
                    patientId={patient.id}
                    onClose={() => setIsIntakeModalOpen(false)}
                />
            )}
        </div>
    );
}

// ===================== MODAL COMPONENTS =====================

function RecordIntakeModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<IntakeInput>({
        resolver: zodResolver(intakeSchema),
        defaultValues: {
            status: "completed",
            vitals: {
                weight: "",
                hr: "",
                bp: "",
                temp: "",
            }
        }
    });

    const currentStatus = watch("status");

    const mutation = useMutation({
        mutationFn: (data: IntakeInput & { submit?: boolean }) => createIntake(patientId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
            queryClient.invalidateQueries({ queryKey: ["patient-audit-logs", patientId] });
            onClose();
        },
        onError: (err: Error) => {
            setServerError(err.message);
        }
    });

    const onSubmit = (data: IntakeInput) => {
        setServerError("");
        mutation.mutate({ ...data, submit: isSubmitting });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">New Intake Record</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Clinical Session</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {serverError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {serverError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Presenting Symptoms / Notes</label>
                            <textarea
                                {...register("symptoms")}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none h-24"
                                placeholder="Describe current symptoms, primary complaint, or clinical observations..."
                            />
                            {errors.symptoms && <p className="text-xs text-red-500 mt-1">{errors.symptoms.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* ... existing vitals ... */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Weight (kg)</label>
                                <input {...register("vitals.weight")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="70" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">BP (mmHg)</label>
                                <input {...register("vitals.bp")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120/80" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">HR (bpm)</label>
                                <input {...register("vitals.hr")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="72" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Temp (&deg;C)</label>
                                <input {...register("vitals.temp")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="36.5" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Clinical Status</label>
                            <div className="flex gap-2">
                                {["completed", "in_progress", "critical"].map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setValue("status", status as "completed" | "in_progress" | "critical")}
                                        className={clsx(
                                            "flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all capitalize",
                                            currentStatus === status
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-200"
                                        )}
                                    >
                                        {status.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" {...register("status")} />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={() => setIsSubmitting(false)}
                            disabled={mutation.isPending}
                            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-bold"
                        >
                            Save as Draft
                        </button>
                        <button
                            type="submit"
                            onClick={() => setIsSubmitting(true)}
                            disabled={mutation.isPending}
                            className="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 font-bold"
                        >
                            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {mutation.isPending ? "Recording..." : "Submit for Triage"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===================== TAB COMPONENTS =====================

function OverviewTab({ patient, age, intakeHistory, formatDate }: { patient: Patient; age: number | null; intakeHistory: PatientIntake[]; formatDate: (d: string | null) => string }) {
    const latestIntake = intakeHistory[0];
    const vitals = latestIntake?.vitals || {};

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vitals Summary</h3>
                    <span className="text-[10px] text-slate-400">Last updated: {latestIntake ? formatDate(latestIntake.created_at) : "N/A"}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <VitalCard label="Blood Type" value="A+" icon={Droplets} color="bg-rose-50 text-rose-600" />
                    <VitalCard label="Height" value={`172 cm`} icon={Ruler} color="bg-blue-50 text-blue-600" />
                    <VitalCard label="Weight" value={vitals.weight ? `${vitals.weight} kg` : "\u2014"} icon={Weight} color="bg-emerald-50 text-emerald-600" />
                    <VitalCard label="BMI" value="24.2" icon={Activity} color="bg-violet-50 text-violet-600" />
                    <VitalCard label="Heart Rate" value={vitals.hr ? `${vitals.hr} bpm` : "\u2014"} icon={Heart} color="bg-pink-50 text-pink-600" />
                    <VitalCard label="Blood Pressure" value={vitals.bp || "\u2014"} icon={Stethoscope} color="bg-amber-50 text-amber-600" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Personal Information</h3>
                    <div className="space-y-4">
                        <InfoRow icon={User} label="Full Name" value={patient.name} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={`${formatDate(patient.dob)}${age !== null ? ` (${age} years)` : ""}`} />
                        <InfoRow icon={User} label="Gender" value={patient.gender || "\u2014"} />
                        <InfoRow icon={Phone} label="Phone" value={patient.phone || "\u2014"} />
                        <InfoRow icon={Mail} label="Email" value={patient.email || "\u2014"} />
                        <InfoRow icon={Shield} label="Insurance" value={patient.insurance_details || "\u2014"} />
                    </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">Medical Context</h3>
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-medium text-slate-500">Current Condition</span>
                            <p className="text-sm text-slate-900 mt-1.5 font-semibold bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{patient.condition || "Diagnostic Pending"}</p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500">Primary Care Physician</span>
                            <div className="flex items-center gap-3 mt-1.5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                    {patient.assigned_doctor ? patient.assigned_doctor.split(' ').map(n => n[0]).join('') : '?'}
                                </div>
                                <p className="text-sm text-slate-900 font-semibold">{patient.assigned_doctor || "Not assigned"}</p>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500">Clinical Narrative</span>
                            {latestIntake ? (
                                <div className="mt-1.5 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <p className="text-sm text-slate-700 italic border-l-2 border-blue-100 pl-3 leading-relaxed">
                                        &ldquo;{latestIntake.symptoms || "No clinical notes available."}&rdquo;
                                    </p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                        <span className="text-[10px] text-slate-400">Captured by: {latestIntake.created_by || "System"}</span>
                                        <Link href="#" className="text-[10px] font-bold text-blue-600 hover:underline">View Intake Details</Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-1.5 p-4 bg-white rounded-xl border border-slate-100 shadow-sm border-dashed text-center">
                                    <p className="text-xs text-slate-400 py-4">No recent intake data recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all shadow-sm">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="text-xs font-medium text-slate-500 truncate mr-2">{label}</span>
                <span className="text-sm text-slate-900 font-bold truncate text-right">{value}</span>
            </div>
        </div>
    );
}

function IntakeHistoryTab({ patientId, intakeHistory, formatDate }: { patientId: string; intakeHistory: any[]; formatDate: (d: string | null) => string }) {
    const queryClient = useQueryClient();
    if (intakeHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-500 font-medium">No medical intake records found.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Start by recording the first patient intake session.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto -mx-8">
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="text-left py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                        <th className="text-left py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Presenting Symptoms</th>
                        <th className="text-left py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Clinical Vitals</th>
                        <th className="text-left py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                        <th className="text-left py-4 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Staff</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {intakeHistory.map((intake: any) => (
                        <tr key={intake.id} className="hover:bg-slate-50 group transition-all">
                            <td className="py-5 px-8 text-sm font-semibold text-slate-600 whitespace-nowrap">{formatDate(intake.created_at)}</td>
                            <td className="py-5 px-8 text-sm text-slate-700 max-w-xs truncate">{intake.symptoms || "\u2014"}</td>
                            <td className="py-5 px-8">
                                {intake.vitals ? (
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(intake.vitals).map(([k, v]) => (
                                            <span key={k} className="inline-flex items-center px-2 py-1 rounded bg-slate-100/80 text-[10px] text-slate-600 border border-slate-200 shadow-sm">
                                                <span className="font-bold uppercase opacity-50 mr-1">{k}:</span> {String(v)}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-300 italic">No vitals logged</span>
                                )}
                            </td>
                            <td className="py-5 px-8">
                                <div className="flex flex-col gap-1.5">
                                    <span className={clsx(
                                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                                        intake.status === "completed" ? "bg-emerald-100 text-emerald-800" : intake.status === "critical" ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                                    )}>
                                        {intake.status.replace("_", " ")}
                                    </span>
                                    {intake.workflow && (
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit border",
                                            intake.workflow.current_state === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                intake.workflow.current_state === 'DRAFT' ? "bg-slate-50 text-slate-500 border-slate-100" :
                                                    "bg-amber-50 text-amber-700 border-amber-100"
                                        )}>
                                            {intake.workflow.current_state.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-5 px-8 text-sm font-medium text-slate-500 flex flex-col">
                                <span>{intake.created_by || "System"}</span>
                                {intake.workflow?.current_state === 'DRAFT' && (
                                    <button
                                        onClick={async () => {
                                            await fetch(`/api/intake/${intake.id}/state`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ state: "SUBMITTED", notes: "Manual submission from history" }),
                                            });
                                            queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:underline mt-1 text-left"
                                    >
                                        Submit Intake
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function AuditLogTab({ patientId }: { patientId: string }) {
    const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
        queryKey: ["patient-audit-logs", patientId],
        queryFn: () => fetchAuditLogs(patientId),
    });

    if (isLoading) return <div className="py-12 text-center text-slate-400 animate-pulse">Retrieving clinical activity trail...</div>;
    if (error || !logs) return <div className="py-12 text-center text-rose-500">Failed to load clinical activity log.</div>;

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-500 font-medium">No activity trail available.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Audit logs will appear here as the record is modified.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {logs.map((log) => (
                    <div key={log.id} className="relative group">
                        <div className="absolute -left-[19px] top-1 w-4 h-4 rounded-full bg-white border-4 border-slate-200 group-hover:border-blue-400 transition-colors z-10" />
                        <div className="bg-slate-50 group-hover:bg-slate-100/50 p-4 rounded-xl border border-slate-100 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-900 capitalize">{log.action.replace(/_/g, " ")}</span>
                                <span className="text-[10px] font-medium text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{log.entity} registry updated by {log.user_id || "System"}</p>
                            {log.details && (
                                <div className="mt-3 p-2 bg-white rounded border border-slate-100 overflow-hidden">
                                    <pre className="text-[10px] text-slate-400 overflow-hidden truncate">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AppointmentsTab() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <Calendar className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium font-bold">No Scheduled Appointments</p>
            <p className="text-xs text-slate-400 mt-2">Appointments will be visible once scheduled by the clinical staff.</p>
        </div>
    );
}

function TreatmentPlansTab() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium font-bold">No Active Care Plans</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Physicians can draft care plans during subsequent consultations.</p>
        </div>
    );
}

function LabResultsTab() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <FlaskConical className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium font-bold">No Diagnostic Reports</p>
            <p className="text-xs text-slate-400 mt-1">Laboratory results will be indexed here automatically.</p>
        </div>
    );
}
