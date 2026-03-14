"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    Plus,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Loader2,
    UserX,
    UserCheck,
    Shield,
    Building2,
} from "lucide-react";
import { User, RoleName } from "@/types";
import clsx from "clsx";

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                active
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
        >
            {label}
        </button>
    );
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-purple-100", text: "text-purple-700" },
    doctor: { bg: "bg-emerald-100", text: "text-emerald-700" },
    nurse: { bg: "bg-blue-100", text: "text-blue-700" },
    receptionist: { bg: "bg-amber-100", text: "text-amber-700" },
    lab_technician: { bg: "bg-cyan-100", text: "text-cyan-700" },
    billing_officer: { bg: "bg-orange-100", text: "text-orange-700" },
    specialist: { bg: "bg-indigo-100", text: "text-indigo-700" },
    compliance_officer: { bg: "bg-rose-100", text: "text-rose-700" },
};

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin", doctor: "Doctor", nurse: "Nurse",
    receptionist: "Receptionist", lab_technician: "Lab Technician",
    billing_officer: "Billing Officer", specialist: "Specialist",
    compliance_officer: "Compliance Officer", patient: "Patient",
};

function RoleBadge({ role }: { role: string }) {
    const c = ROLE_COLORS[role] || { bg: "bg-slate-100", text: "text-slate-600" };
    return (
        <span className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", c.bg, c.text)}>
            <Shield className="w-2.5 h-2.5" />
            {ROLE_LABELS[role] || role}
        </span>
    );
}

function StatusBadge({ status }: { status?: string }) {
    const active = status !== "inactive";
    return (
        <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
        )}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500" : "bg-red-500")} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

export default function AdminPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleName | "all">("all");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [confirmModal, setConfirmModal] = useState<{ user: User; action: "deactivate" | "activate" } | null>(null);

    const { data, isLoading, isFetching } = useQuery<{
        data: User[];
        pagination: { page: number; limit: number; total: number };
    }>({
        queryKey: ["admin-users", page, limit, search, roleFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(limit));
            if (search) params.set("search", search);
            if (roleFilter !== "all") params.set("role", roleFilter);
            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ userId, action }: { userId: string; action: "deactivate" | "activate" }) => {
            if (action === "deactivate") {
                const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Failed to deactivate");
            } else {
                const res = await fetch(`/api/admin/users/${userId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "active" }),
                });
                if (!res.ok) throw new Error("Failed to activate");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setConfirmModal(null);
        },
    });

    const users: User[] = data?.data || [];
    const total = data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const formatDate = useCallback((d: string | null | undefined) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }, []);

    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                id: "name",
                header: "Name",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
                            {(row.original.first_name?.[0] || row.original.email[0]).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 text-sm">
                            {row.original.first_name && row.original.last_name
                                ? `${row.original.first_name} ${row.original.last_name}`
                                : "—"}
                        </span>
                    </div>
                ),
                size: 200,
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue() as string}</span>,
                size: 220,
            },
            {
                accessorKey: "role",
                header: "Role",
                cell: ({ getValue }) => <RoleBadge role={getValue() as string} />,
                size: 150,
            },
            {
                accessorKey: "department",
                header: "Department",
                cell: ({ getValue }) => {
                    const dept = getValue() as string | null;
                    return dept ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {dept}
                        </span>
                    ) : <span className="text-slate-300 text-sm">—</span>;
                },
                size: 140,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
                size: 100,
            },
            {
                accessorKey: "created_at",
                header: "Created",
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-500">{formatDate(getValue() as string)}</span>
                ),
                size: 120,
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => router.push(`/admin/users/${row.original.id}/edit`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setConfirmModal({
                                user: row.original,
                                action: row.original.status === "inactive" ? "activate" : "deactivate"
                            })}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                row.original.status === "inactive"
                                    ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                    : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            )}
                            title={row.original.status === "inactive" ? "Activate" : "Deactivate"}
                        >
                            {row.original.status === "inactive"
                                ? <UserCheck className="w-4 h-4" />
                                : <UserX className="w-4 h-4" />
                            }
                        </button>
                    </div>
                ),
                size: 90,
            },
        ],
        [router, formatDate]
    );

    const table = useReactTable({
        data: users,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Settings</h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        {total} users total
                        {isFetching && !isLoading && (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                    </p>
                </div>
                <button
                    onClick={() => router.push("/admin/users/create")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: total, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Active", value: users.filter(u => u.status !== "inactive").length, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Inactive", value: users.filter(u => u.status === "inactive").length, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "text-purple-600", bg: "bg-purple-50" },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{isLoading ? "—" : stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative flex-1 min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <FilterPill label="All Roles" active={roleFilter === "all"} onClick={() => { setRoleFilter("all"); setPage(1); }} />
                            <FilterPill label="Doctor" active={roleFilter === "doctor"} onClick={() => { setRoleFilter("doctor"); setPage(1); }} />
                            <FilterPill label="Nurse" active={roleFilter === "nurse"} onClick={() => { setRoleFilter("nurse"); setPage(1); }} />
                            <FilterPill label="Receptionist" active={roleFilter === "receptionist"} onClick={() => { setRoleFilter("receptionist"); setPage(1); }} />
                            <FilterPill label="Lab Tech" active={roleFilter === "lab_technician"} onClick={() => { setRoleFilter("lab_technician"); setPage(1); }} />
                            <FilterPill label="Billing Officer" active={roleFilter === "billing_officer"} onClick={() => { setRoleFilter("billing_officer"); setPage(1); }} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-slate-100">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                            style={{ width: header.getSize() }}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <span className="cursor-pointer select-none">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-slate-500">Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-12">
                                        <p className="text-slate-500 text-sm">No users found.</p>
                                        <button
                                            onClick={() => router.push("/admin/users/create")}
                                            className="mt-2 text-blue-500 text-sm font-medium hover:underline"
                                        >
                                            Add the first user
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm font-medium text-slate-700">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Status Modal */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            {confirmModal.action === "deactivate" ? "Deactivate User?" : "Activate User?"}
                        </h3>
                        <p className="text-sm text-slate-500 mb-5">
                            {confirmModal.action === "deactivate"
                                ? `This will prevent ${confirmModal.user.first_name || confirmModal.user.email} from accessing the system.`
                                : `This will restore access for ${confirmModal.user.first_name || confirmModal.user.email}.`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => toggleMutation.mutate({ userId: confirmModal.user.id, action: confirmModal.action })}
                                disabled={toggleMutation.isPending}
                                className={clsx(
                                    "flex-1 py-2 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2",
                                    confirmModal.action === "deactivate"
                                        ? "bg-rose-500 hover:bg-rose-600"
                                        : "bg-emerald-500 hover:bg-emerald-600"
                                )}
                            >
                                {toggleMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                {confirmModal.action === "deactivate" ? "Deactivate" : "Activate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
