"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    UserPlus,
    Loader2,
    AlertCircle,
    Mail,
    Lock,
    CheckCircle2,
    Eye,
    EyeOff,
} from "lucide-react";
import { RoleName } from "@/types";
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

interface CreateUserForm {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: RoleName | "";
    department: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CreateUserForm>({
        first_name: "", last_name: "", email: "", password: "", role: "", department: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CreateUserForm, string>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);

    const availableDepts = form.role ? (ROLE_DEPARTMENT_MAP[form.role] || DEPARTMENTS) : DEPARTMENTS;

    const mutation = useMutation({
        mutationFn: async (data: CreateUserForm) => {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to create user");
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setSuccess(true);
        },
    });

    const validate = () => {
        const newErrors: Partial<Record<keyof CreateUserForm, string>> = {};
        if (!form.first_name.trim()) newErrors.first_name = "First name is required";
        if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
        if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Valid email is required";
        if (!form.password || form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        if (!form.role) newErrors.role = "Role is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        mutation.mutate(form);
    };

    if (success) {
        return (
            <div className="max-w-lg mx-auto mt-20 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">User Created!</h2>
                <p className="text-slate-500 text-sm">
                    <span className="font-semibold text-slate-700">{form.first_name} {form.last_name}</span> has been added as{" "}
                    <span className="capitalize font-medium">{form.role?.replace("_", " ")}</span>.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => { setSuccess(false); setForm({ first_name: "", last_name: "", email: "", password: "", role: "", department: "" }); }}
                        className="px-5 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors"
                    >
                        Add Another
                    </button>
                    <button
                        onClick={() => router.push("/admin")}
                        className="px-5 py-2 bg-blue-500 text-white font-medium rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header — matches patient create style */}
            <div className="flex items-center gap-3">
                <Link href="/admin" className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New User</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Create a staff account with role and department</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 space-y-5">

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                placeholder="Sarah"
                                className={clsx(
                                    "w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400",
                                    errors.first_name ? "border-rose-400 bg-rose-50" : "border-slate-200"
                                )}
                            />
                            {errors.first_name && <p className="text-rose-500 text-xs mt-1">{errors.first_name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                placeholder="Johnson"
                                className={clsx(
                                    "w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400",
                                    errors.last_name ? "border-rose-400 bg-rose-50" : "border-slate-200"
                                )}
                            />
                            {errors.last_name && <p className="text-rose-500 text-xs mt-1">{errors.last_name}</p>}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={form.email}
                                autoComplete="off"
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="staff@clinic.com"
                                className={clsx(
                                    "w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400",
                                    errors.email ? "border-rose-400 bg-rose-50" : "border-slate-200"
                                )}
                            />
                        </div>
                        {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                autoComplete="new-password"
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Min 6 characters"
                                className={clsx(
                                    "w-full pl-10 pr-10 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400",
                                    errors.password ? "border-rose-400 bg-rose-50" : "border-slate-200"
                                )}
                            />
                            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Role <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "admin", label: "Admin" },
                                { value: "doctor", label: "Doctor" },
                                { value: "nurse", label: "Nurse" },
                                { value: "receptionist", label: "Receptionist" },
                                { value: "lab_technician", label: "Lab Technician" },
                                { value: "billing_officer", label: "Billing Officer" },
                            ].map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, role: r.value as RoleName, department: "" }))}
                                    className={clsx(
                                        "py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                                        form.role === r.value
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                                    )}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        {errors.role && <p className="text-rose-500 text-xs mt-1">{errors.role}</p>}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Department <span className="text-slate-400 font-normal">(optional)</span></label>
                        <select
                            value={form.department}
                            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                            disabled={!form.role}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                        >
                            <option value="">{form.role ? "Select Department" : "Select a role first"}</option>
                            {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Error message */}
                    {mutation.isError && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2 text-rose-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p className="text-sm font-medium">{(mutation.error as Error).message}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-end gap-3">
                    <Link href="/admin" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Create User
                    </button>
                </div>
            </form>
        </div>
    );
}
