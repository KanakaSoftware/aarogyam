import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['doctor', 'specialist'])
            .order('first_name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GET /api/doctors error:", error);
        return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
    }
}
