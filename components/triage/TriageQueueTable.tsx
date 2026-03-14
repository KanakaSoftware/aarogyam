"use client";

import { useMemo, useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table";
import { 
    User, 
    Clock, 
    Stethoscope, 
    MoreVertical, 
    ArrowUpDown,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import { TriageAssessment } from "@/types";
import clsx from "clsx";

interface TriageQueueTableProps {
    data: any[];
    isLoading: boolean;
    onAccept: (id: string) => Promise<void>;
}

export function TriageQueueTable({ data, isLoading, onAccept }: TriageQueueTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    const columnHelper = createColumnHelper<any>();

    const columns = useMemo(() => [
        columnHelper.accessor("patients.name", {
            header: "Patient",
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                        {info.getValue()?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{info.getValue()}</p>
                        <p className="text-[10px] text-slate-400 font-medium">#{info.row.original.patient_id.substring(0, 8)}</p>
                    </div>
                </div>
            )
        }),
        columnHelper.accessor("priority", {
            header: "Priority",
            cell: info => <PriorityBadge priority={info.getValue()} />
        }),
        columnHelper.accessor("symptoms", {
            header: "Assessment Findings",
            cell: info => (
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {info.getValue()?.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold uppercase">
                            {s}
                        </span>
                    ))}
                    {info.getValue()?.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400">+{info.getValue().length - 3} more</span>
                    )}
                </div>
            )
        }),
        columnHelper.accessor("created_at", {
            header: "Wait Time",
            cell: info => {
                const waitMinutes = Math.floor((new Date().getTime() - new Date(info.getValue()).getTime()) / 60000);
                return (
                    <div className={clsx(
                        "flex items-center gap-2 font-bold text-xs",
                        waitMinutes > 15 ? "text-rose-600" : "text-slate-600"
                    )}>
                        <Clock className="w-3.5 h-3.5" />
                        {waitMinutes}m
                        {waitMinutes > 15 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                    </div>
                );
            }
        }),
        columnHelper.accessor("status", {
            header: "Status",
            cell: info => (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {info.getValue().replace(/_/g, ' ')}
                </span>
            )
        }),
        columnHelper.display({
            id: "actions",
            header: () => <div className="text-right">Operations</div>,
            cell: info => (
                <div className="text-right">
                    <button
                        onClick={async () => {
                            setAcceptingId(info.row.original.id);
                            await onAccept(info.row.original.id);
                            setAcceptingId(null);
                        }}
                        disabled={acceptingId !== null}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border-2 border-slate-900 text-white text-[10px] font-bold hover:bg-white hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {acceptingId === info.row.original.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Stethoscope className="w-3 h-3" />
                        )}
                        CLAIM PATIENT
                    </button>
                </div>
            )
        })
    ], [acceptingId, onAccept, columnHelper]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="bg-white rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="bg-slate-50/50">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <div
                                            className={clsx(
                                                header.column.getCanSort() ? "cursor-pointer select-none flex items-center gap-2 group" : ""
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-8 py-6">
                                        <div className="h-6 bg-slate-50 rounded-xl w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-200">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold">Clear Triage Queue</p>
                                            <p className="text-slate-400 text-xs mt-1">No patients are currently waiting for assessment.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-8 py-6">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
