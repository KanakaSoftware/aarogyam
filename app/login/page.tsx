import { Suspense } from "react";
import LoginForm from "@/modules/auth/LoginForm";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background Gradient Accents */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />

            <Suspense fallback={<Loader2 className="animate-spin text-emerald-500 w-8 h-8" />}>
                <div className="relative z-10 w-full max-w-md">
                    <LoginForm />
                </div>
            </Suspense>
        </main>
    );
}
