"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { AuthService } from "@/services/auth.service";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, HeartPulse } from "lucide-react";

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [errorText, setErrorText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        setErrorText("");

        const result = await AuthService.login(data);

        if (result.success) {
            const redirectedFrom = searchParams.get("redirectedFrom") || "/dashboard";
            router.push(redirectedFrom);
            router.refresh();
        } else {
            setErrorText(result.error || "Failed to login");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-white p-10 rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center mb-10">
                <div className="bg-emerald-50 p-4 rounded-2xl mb-4 border border-emerald-100 rotate-3 transition-transform hover:rotate-0">
                    <HeartPulse className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-poppins text-center">
                    Clinical Portal
                </h2>
                <p className="text-sm text-slate-500 mt-2 font-medium font-poppins">
                    Enter your credentials to access the registry
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {errorText && (
                    <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        {errorText}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 font-poppins">
                        Email Address
                    </label>
                    <input
                        {...register("email")}
                        type="email"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all outline-none font-poppins text-sm"
                        placeholder="doctor@example.com"
                    />
                    {errors.email && (
                        <p className="text-xs text-rose-500 mt-1 ml-1 font-medium">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 font-poppins">
                            Password
                        </label>
                        <button type="button" className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider hover:text-emerald-700 transition-colors">
                            Forgot?
                        </button>
                    </div>
                    <input
                        {...register("password")}
                        type="password"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all outline-none font-poppins text-sm"
                        placeholder="••••••••"
                    />
                    {errors.password && (
                        <p className="text-xs text-rose-500 mt-1 ml-1 font-medium">{errors.password.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-poppins"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Sign In to Dashboard"
                    )}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
                <p className="text-xs text-slate-400 font-medium font-poppins">
                    CareFlow POC Platform v1.2
                </p>
            </div>
        </div>
    );
}
