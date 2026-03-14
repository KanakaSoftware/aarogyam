"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Stethoscope,
    ClipboardList,
    TestTube,
    FileText,
    ShieldCheck,
    Settings,
    Activity
} from "lucide-react";
import { RoleName } from "@/types";
import { hasAccess } from "@/lib/rbac";
import clsx from "clsx";

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    requiredResource: string;
}

const NAV_ITEMS: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiredResource: "dashboard" },
    { name: "Patients", href: "/patients", icon: Users, requiredResource: "patients" },
    { name: "Appointments", href: "/appointments", icon: Calendar, requiredResource: "appointments" },
    { name: "Triage Queue", href: "/triage-queue", icon: Stethoscope, requiredResource: "triage" },
    { name: "Triage Dashboard", href: "/triage-dashboard", icon: Activity, requiredResource: "triage" },
    // { name: "Protocol Management", href: "/admin/triage-rules", icon: ShieldCheck, requiredResource: "admin" },
    // { name: "Treatment Plans", href: "/treatment-plans", icon: ClipboardList, requiredResource: "treatment-plans" },
    { name: "Lab Management", href: "/lab-management", icon: TestTube, requiredResource: "lab" },
    // { name: "Reports", href: "/reports", icon: FileText, requiredResource: "reports" },
    // { name: "Compliance", href: "/compliance", icon: ShieldCheck, requiredResource: "compliance" },
    { name: "Admin Settings", href: "/admin", icon: Settings, requiredResource: "admin" },
];

export function Sidebar({ role }: { role: RoleName }) {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-900 z-20 hidden md:flex flex-col shadow-2xl">
            <div className="h-16 flex items-center px-6 border-b border-slate-900/50">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                        <Stethoscope className="w-6 h-6" />
                    </div>
                    <span>CareFlow <span className="text-slate-400 font-medium">POC</span></span>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-hide">
                {NAV_ITEMS.filter(item => hasAccess(role, item.requiredResource)).map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer group mb-1",
                                isActive
                                    ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                            )}
                        >
                            <Icon className={clsx(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-900/50">
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                        Current Session
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-slate-300 font-medium capitalize">{role || 'None'}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
