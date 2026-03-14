"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { User } from "@/types";
import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Topbar({ user }: { user: User }) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await AuthService.logout();
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
            <div className="flex-1">
                {/* Mobile menu toggle could go here */}
            </div>

            <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col items-end">
                    <span className="font-semibold text-slate-900 leading-tight">
                        {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                    </span>
                    <span className="text-slate-500 capitalize leading-tight">
                        {user?.role}
                    </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <UserIcon className="w-5 h-5" />
                </div>
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-2"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
