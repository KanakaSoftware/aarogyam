"use client";

import { TriageForm } from "@/components/triage/TriageForm";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function NewTriagePage() {
    const router = useRouter();

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                         <Link 
                            href="/triage-queue" 
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Professional Triage
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Clinical Assessment</h1>
                    <p className="text-slate-500 max-w-2xl">
                        Record patient symptoms, vital signs, and pain levels. The clinical engine will automatically calculate priority based on institutional protocols.
                    </p>
                </div>
            </header>

            <div className="bg-slate-50/50 p-4 md:p-8 rounded-[40px] border-2 border-slate-100/50">
                <TriageForm onSuccess={() => router.push("/triage-queue")} />
            </div>
        </div>
    );
}
