"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    User as UserIcon,
} from "lucide-react";
import { RoleName, UserStatus } from "@/types";
import clsx from "clsx";

const DEPARTMENTS = [
    "Cardiology", "Emergency", "General Medicine", "Surgery",
    "Pediatrics", "Radiology", "Pathology", "Pharmacy",
    "ICU", "Billing", "Administration", "Nursing", "Laboratory"
];

const ROLE_DEPARTMENT_MAP: Record<string, string[]> = {
    doctor: ["Cardiology", "Emergency", "General Medicine", "Surgery", "Pediatrics", "Radiology", "ICU"],
    nurse: ["Emergency", "General Medicine", "ICU", "Surgery", "Pediatrics", "Nursing"],
    lab_technician: ["Laboratory", "Pathology", "Radiology"],
    billing_officer: ["Billing"],
    receptionist: ["Administration", "General Medicine", "Emergency"],
    admin: ["Administration"],
    specialist: ["Cardiology", "Surgery", "Radiology", "Pediatrics", "ICU"],
};

interface EditForm {
    first_name: string;
    last_name: string;
    role: RoleName | "";
    department: string;
    status: UserStatus;
}

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const userId = params.id as string;

    const [form, setForm] = useState<EditForm>({
        first_name: "",
        last_name: "",
        role: "",
        department: "",
        status: "active",
    });

    const { data: user, isLoading } = useQuery({
        queryKey: ["admin-user", userId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/users/${userId}`);
            if (!res.ok) throw new Error("User not found");
            return res.json();
        },
        enabled: !!userId,
    });

    useEffect(() => {
        if (user) {
            setForm({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                role: user.role || "",
                department: user.department || "",
                status: user.status || "active",
            });
        }
    }, [user]);

    const mutation = useMutation({
        mutationFn: async (data: EditForm) => {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to update user");
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
            router.push("/admin");
        },
    });

    const availableDepts = form.role ? (ROLE_DEPARTMENT_MAP[form.role] || DEPARTMENTS) : DEPARTMENTS;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center gap-4">
                <Link href="/admin" className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {(form.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Edit {form.first_name ? `${form.first_name} ${form.last_name}` : user?.email}
                            </h1>
                            <p className="text-slate-500 text-sm">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </header>

            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden"
            >
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">First Name</label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Last Name</label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Role</label>
                        <select
                            value={form.role}
                            onChange={e => setForm(f => ({ ...f, role: e.target.value as RoleName, department: "" }))}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                        >
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="doctor">Doctor</option>
                            <option value="nurse">Nurse</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="lab_technician">Lab Technician</option>
                            <option value="billing_officer">Billing Officer</option>
                            <option value="specialist">Specialist</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Department</label>
                        <select
                            value={form.department}
                            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                        >
                            <option value="">No Department</option>
                            {availableDepts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Account Status</label>
                        <div className="flex gap-3">
                            {(["active", "inactive"] as UserStatus[]).map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, status: s }))}
                                    className={clsx(
                                        "flex-1 py-3 px-4 rounded-2xl border-2 text-sm font-bold capitalize transition-all",
                                        form.status === s
                                            ? s === "active"
                                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                                : "border-rose-400 bg-rose-50 text-rose-700"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {mutation.isError && (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-bold">{(mutation.error as Error).message}</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Link href="/admin" className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all">Cancel</Link>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
