import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/triage-rules
 * Fetch all active and inactive clinical rules.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: rules, error } = await supabase
            .from('triage_rules')
            .select('*')
            .order('priority', { ascending: false });

        if (error) throw error;
        return NextResponse.json(rules);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/triage-rules
 * Create a new clinical rule.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createClient();

        const { data: rule, error } = await supabase
            .from('triage_rules')
            .insert({
                name: body.name,
                conditions: body.conditions,
                priority: body.priority,
                department: body.department,
                is_active: body.is_active ?? true
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(rule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
