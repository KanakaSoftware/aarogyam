"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Plus,
    Eye,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Download,
    Trash2,
    Loader2,
} from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { DeletePatientModal } from "@/components/patients/DeletePatientModal";
import { Patient, PatientStatus } from "@/types";
import clsx from "clsx";

// Status component
function StatusBadge({ status }: { status: PatientStatus }) {
    const styles: Record<PatientStatus, { dot: string; text: string; bg: string }> = {
        active: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
        critical: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
        discharged: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
    };
    const s = styles[status] || styles.active;
    return (
        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize", s.bg, s.text)}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", s.dot)} />
            {status}
        </span>
    );
}

// Filter pill button
function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
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

async function fetchPatients(params: {
    page: number;
    limit: number;
    search: string;
    statusFilter: string;
}) {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("limit", String(params.limit));
    if (params.search) sp.set("search", params.search);

    const res = await fetch(`/api/patients?${sp.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch patients");
    return res.json();
}

export default function PatientsListPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sorting, setSorting] = useState<SortingState>([]);

    // Delete Modal State
    const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const queryClient = useQueryClient();

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["patients", page, limit, debouncedSearch, statusFilter],
        queryFn: () =>
            fetchPatients({ page, limit, search: debouncedSearch, statusFilter }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/patients/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete patient");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patients"] });
        },
    });

    const handleDeleteClick = (patient: Patient) => {
        setPatientToDelete(patient);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (patientToDelete) {
            await deleteMutation.mutateAsync(patientToDelete.id);
            setPatientToDelete(null);
        }
    };

    const patients: Patient[] = useMemo(() => {
        if (!data?.data) return [];
        if (statusFilter === "all") return data.data;
        return data.data.filter((p: Patient) => p.status === statusFilter);
    }, [data, statusFilter]);

    const totalPatients = data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(totalPatients / limit) || 1;

    const formatDate = useCallback((d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }, []);

    const getShortId = useCallback((id: string) => {
        return `PT-${id.substring(0, 3).toUpperCase()}`;
    }, []);

    const columns = useMemo<ColumnDef<Patient>[]>(
        () => [
            {
                accessorKey: "id",
                header: "Patient ID",
                cell: ({ row }) => (
                    <span className="text-blue-600 font-medium text-sm">
                        {getShortId(row.original.id)}
                    </span>
                ),
                size: 110,
            },
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
                            {row.original.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)}
                        </div>
                        <span className="font-medium text-slate-900 text-sm">
                            {row.original.name}
                        </span>
                    </div>
                ),
                size: 200,
            },
            {
                id: "age",
                header: "Age",
                cell: ({ row }) => {
                    if (!row.original.dob) return <span className="text-slate-400">—</span>;
                    const age = Math.floor(
                        (Date.now() - new Date(row.original.dob).getTime()) / 31557600000
                    );
                    return <span className="text-sm text-slate-600">{age}</span>;
                },
                size: 70,
            },
            {
                accessorKey: "gender",
                header: "Gender",
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-600 capitalize">
                        {(getValue() as string) || "—"}
                    </span>
                ),
                size: 90,
            },
            {
                accessorKey: "assigned_doctor",
                header: "Assigned Doctor",
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-600">
                        {(getValue() as string) || "—"}
                    </span>
                ),
                size: 150,
            },
            {
                accessorKey: "condition",
                header: "Condition",
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-600">
                        {(getValue() as string) || "—"}
                    </span>
                ),
                size: 150,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => (
                    <StatusBadge status={getValue() as PatientStatus} />
                ),
                size: 120,
            },
            {
                accessorKey: "created_at",
                header: "Last Visit",
                cell: ({ getValue }) => (
                    <span className="text-sm text-slate-500">
                        {formatDate(getValue() as string)}
                    </span>
                ),
                size: 120,
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => router.push(`/patients/${row.original.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() =>
                                router.push(`/patients/${row.original.id}/edit`)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteClick(row.original)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ),
                size: 110,
            },
        ],
        [router, formatDate, getShortId]
    );

    const table = useReactTable({
        data: patients,
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Patient Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        {totalPatients} patients total
                        {isFetching && !isLoading && (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                    </p>
                </div>
                <button
                    onClick={() => router.push("/patients/create")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Patient
                </button>
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by name, ID, or condition..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Filter pills */}
                        <div className="flex items-center gap-2">
                            <FilterPill
                                label="All"
                                active={statusFilter === "all"}
                                onClick={() => setStatusFilter("all")}
                            />
                            <FilterPill
                                label="Active"
                                active={statusFilter === "active"}
                                onClick={() => setStatusFilter("active")}
                            />
                            <FilterPill
                                label="Critical"
                                active={statusFilter === "critical"}
                                onClick={() => setStatusFilter("critical")}
                            />
                            <FilterPill
                                label="Discharged"
                                active={statusFilter === "discharged"}
                                onClick={() => setStatusFilter("discharged")}
                            />
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
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
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
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
                                            <span className="text-sm text-slate-500">
                                                Loading patients...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-12">
                                        <p className="text-slate-500 text-sm">No patients found.</p>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                            (p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={clsx(
                                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                        p === page
                                            ? "bg-blue-500 text-white"
                                            : "text-slate-600 hover:bg-slate-100"
                                    )}
                                >
                                    {p}
                                </button>
                            )
                        )}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <DeletePatientModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                patientName={patientToDelete?.name || ""}
            />
        </div>
    );
}
