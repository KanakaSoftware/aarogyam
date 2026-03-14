import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createClient();

        const { data: rule, error } = await supabase
            .from('triage_rules')
            .update({
                name: body.name,
                conditions: body.conditions,
                priority: body.priority,
                department: body.department,
                is_active: body.is_active
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(rule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('triage_rules')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
