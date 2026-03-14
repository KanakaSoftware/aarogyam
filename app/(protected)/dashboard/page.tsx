import { UserService } from "@/services/user.service";
import { redirect } from "next/navigation";
import { AuditService } from "@/services/audit.service";
import { Activity, Users, CalendarCheck, FileText, Stethoscope, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { DoctorAssignedPatients } from "@/components/dashboard/DoctorAssignedPatients";

export default async function DashboardPage() {
    const user = await UserService.getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    // Log page view
    await AuditService.logAction("Viewed Dashboard", "Dashboard");

    const roleLabels: Record<string, string> = {
        admin: "System Administrator",
        receptionist: "Front Desk & Reception",
        nurse: "Nursing Staff",
        doctor: "Attending Physician",
        specialist: "Specialist",
        lab_technician: "Laboratory Services",
        billing_officer: "Billing Department",
        compliance_officer: "Compliance Officer",
        patient: "Patient Portal",
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back, {user.first_name || user.email.split("@")[0]}
                    </h1>
                    <p className="text-slate-500 mt-1 text-lg">
                        You are logged in as <span className="font-medium text-emerald-600">{roleLabels[user.role] || user.role}</span>
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Active</span>
                </div>
            </header>

            {/* Analytics overview (Mocked based on POC) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Patients</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">1,248</h3>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-1 rounded-lg">+12% increase</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Appointments Today</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">42</h3>
                        </div>
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                            <CalendarCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-blue-600 font-bold bg-blue-50 w-fit px-2 py-1 rounded-lg">8 remaining</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Lab Orders</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">18</h3>
                        </div>
                        <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-amber-600 font-bold bg-amber-50 w-fit px-2 py-1 rounded-lg">Requires Action</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Reports</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">7</h3>
                        </div>
                        <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-purple-600 font-bold bg-purple-50 w-fit px-2 py-1 rounded-lg">Ready for review</div>
                </div>
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {user.role === 'doctor' && (
                        <section className="animate-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Stethoscope className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-slate-800">Assigned Consultations</h3>
                            </div>
                            <DoctorAssignedPatients />
                        </section>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                        <div className="text-slate-500 py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                            <p className="text-sm font-medium">Activity feed will be populated based on your role.</p>
                            <p className="text-xs mt-1">Audit logs are being captured in the background.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                        <h4 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-4">Quick Shortcuts</h4>
                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/patients" className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                <span className="text-sm font-medium">Search Patients</span>
                                <Users className="w-4 h-4" />
                            </Link>
                            <Link href="/appointments" className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                <span className="text-sm font-medium">Schedule Visit</span>
                                <CalendarCheck className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
