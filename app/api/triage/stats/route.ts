import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Total triaged today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: triagedToday } = await supabase
            .from('triage_assessments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // 2. Priority Distribution
        const { data: distribution } = await supabase
            .from('triage_assessments')
            .select('priority');

        const priorityCounts = (distribution || []).reduce((acc: any, curr: any) => {
            acc[curr.priority] = (acc[curr.priority] || 0) + 1;
            return acc;
        }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 });

        // 3. Average Wait Time (all time or filtered)
        const { data: waitTimes } = await supabase
            .from('triage_assessments')
            .select('created_at, status');

        // Logic for wait time (assessment to consultation if available, or current wait if pending)
        // For simplicity, we'll calculate average wait of current queue
        const currentQueue = waitTimes?.filter(i => ['TRIAGED', 'WAITING_FOR_DOCTOR'].includes(i.status)) || [];
        const avgQueueWait = currentQueue.length 
            ? Math.floor(currentQueue.reduce((acc, curr) => acc + (new Date().getTime() - new Date(curr.created_at).getTime()), 0) / (currentQueue.length * 60000))
            : 0;

        return NextResponse.json({
            triagedToday,
            priorityCounts,
            avgQueueWait,
            totalAssessments: distribution?.length || 0
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
