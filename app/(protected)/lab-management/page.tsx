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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Search,
} from "lucide-react";
import clsx from "clsx";
import { LabOrder, LabOrderStatus } from "@/types";
import { LabStatusBadge } from "@/components/lab/LabStatusBadge";
import { LabOrderActions } from "@/components/lab/LabOrderActions";

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

// Temporary hook for dummy role until a provider is used. In production, this would come from Auth Context.
function useCurrentUserRole() {
    const { data } = useQuery({
        queryKey: ["current-user-role"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me"); // Assuming such an endpoint exists or session is known
            if (!res.ok) return { role: "admin" }; // Fallback for POC testing
            const user = await res.json();
            return user;
        }
    });
    return data?.role || "admin";
}

async function fetchLabOrders(params: {
    page: number;
    limit: number;
    search: string;
    statusFilter: string;
}) {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("limit", String(params.limit));
    if (params.search) sp.set("search", params.search);
    if (params.statusFilter !== "all") sp.set("status", params.statusFilter);

    const res = await fetch(`/api/lab-orders?${sp.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch lab orders");
    return res.json();
}

export default function LabManagementPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const role = useCurrentUserRole();

    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sorting, setSorting] = useState<SortingState>([]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["lab-orders", page, limit, debouncedSearch, statusFilter],
        queryFn: () =>
            fetchLabOrders({ page, limit, search: debouncedSearch, statusFilter }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/lab-orders/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete order");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
            setIsDeleting(null);
        }
    });

    const orders: LabOrder[] = useMemo(() => {
        return data?.data || [];
    }, [data]);

    const totalOrders = data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(totalOrders / limit) || 1;

    const formatDate = useCallback((d: string) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }, []);

    const getShortId = useCallback((id: string) => {
        return `ORD-${id.substring(0, 5).toUpperCase()}`;
    }, []);

    const columns = useMemo<ColumnDef<LabOrder>[]>(
        () => [
            {
                accessorKey: "id",
                header: "Order ID",
                cell: ({ row }) => (
                    <span className="text-blue-600 font-medium text-sm">
                        {getShortId(row.original.id)}
                    </span>
                ),
                size: 110,
            },
            {
                accessorKey: "patient_name",
                header: "Patient Name",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-900 text-sm">
                            {row.original.patients?.name || "—"}
                        </span>
                    </div>
                ),
                size: 200,
            },
            {
                accessorKey: "test_name",
                header: "Test Name",
                cell: ({ getValue }) => (
                    <span className="text-sm font-medium text-slate-700">
                        {getValue() as string}
                    </span>
                ),
                size: 200,
            },
            {
                accessorKey: "ordered_by",
                header: "Ordered By",
                cell: ({ row }) => (
                    <span className="text-sm text-slate-600">
                        {row.original.doctors ? `Dr. ${row.original.doctors.first_name} ${row.original.doctors.last_name}` : 'Unknown Doctor'}
                    </span>
                ),
                size: 150,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => (
                    <LabStatusBadge status={getValue() as LabOrderStatus} />
                ),
                size: 140,
            },
            {
                accessorKey: "ordered_at",
                header: "Ordered Date",
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
                    <LabOrderActions 
                        orderId={row.original.id} 
                        status={row.original.status} 
                        role={role}
                        onView={() => router.push(`/lab-management/${row.original.id}`)}
                        onEdit={() => router.push(`/lab-management/${row.original.id}/edit`)}
                        onDelete={() => setIsDeleting(row.original.id)}
                    />
                ),
                size: 120,
            },
        ],
        [router, formatDate, getShortId, role]
    );

    const table = useReactTable({
        data: orders,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Lab Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        {totalOrders} tests total
                        {isFetching && !isLoading && (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                    </p>
                </div>

                <button
                    onClick={() => router.push("/lab-management/create")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30"
                >
                    <Plus className="w-4 h-4" />
                    New Lab Order
                </button>
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
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
                                placeholder="Search by Patient Name, Test Name, or Order ID..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all shadow-sm"
                            />
                        </div>

                        {/* Filter pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                            <FilterPill label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                            <FilterPill label="Ordered" active={statusFilter === "ORDERED"} onClick={() => setStatusFilter("ORDERED")} />
                            <FilterPill label="Sample Collected" active={statusFilter === "SAMPLE_COLLECTED"} onClick={() => setStatusFilter("SAMPLE_COLLECTED")} />
                            <FilterPill label="Processing" active={statusFilter === "PROCESSING"} onClick={() => setStatusFilter("PROCESSING")} />
                            <FilterPill label="Result Uploaded" active={statusFilter === "RESULT_UPLOADED"} onClick={() => setStatusFilter("RESULT_UPLOADED")} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-slate-100 bg-slate-50/30">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-r border-slate-100 last:border-r-0"
                                            style={{ width: header.getSize() }}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <span className="cursor-pointer select-none">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-16 bg-white">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                            <span className="text-sm font-medium text-slate-500">Loading lab orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-16 bg-white">
                                        <p className="text-slate-500 text-sm font-medium">No lab orders found.</p>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group bg-white">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3.5 border-r border-slate-50 last:border-r-0">
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
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                // Simplified sliding window pagination for POC
                                let p = i + 1;
                                if (totalPages > 5 && page > 3) p = page - 2 + i;
                                if (p > totalPages) return null;
                                
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={clsx(
                                            "w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-sm",
                                            p === page
                                                ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600/20 ring-offset-1"
                                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Lab Order?</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            This action cannot be undone. This will permanently remove the lab order and its history.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleting(null)}
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                disabled={deleteMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(isDeleting)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-500/20"
                            >
                                {deleteMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Order"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
