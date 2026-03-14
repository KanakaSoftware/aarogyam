import { UserService } from "@/services/user.service";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { redirect } from "next/navigation";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await UserService.getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
            <Sidebar role={user.role} />
            <div className="flex flex-col flex-1 w-full md:pl-64 transition-all duration-300">
                <Topbar user={user} />
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
