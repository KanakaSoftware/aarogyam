import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/services/appointment.service';
import { UserService } from '@/services/user.service';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = await createClient();
        const { data: appointment } = await supabase.from('appointments').select('*').eq('id', id).single();
        
        if (!appointment) return NextResponse.json({ error: "No appointment found" }, { status: 404 });

        // Permission check
        const isStaff = ['admin', 'receptionist'].includes(currentUser.role);
        const isOwnerDoctor = appointment.doctor_id === currentUser.id;
        
        // For patient owner check, we'd need to link patient_id to auth.uid()
        // For now, let's allow staff and the assigned doctor
        if (!isStaff && !isOwnerDoctor) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const updated = await AppointmentService.updateAppointment(id, body);
        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabase = await createClient();
        const { data: appointment } = await supabase.from('appointments').select('*').eq('id', id).single();
        
        if (!appointment) return NextResponse.json({ error: "No appointment found" }, { status: 404 });

        const isStaff = ['admin', 'receptionist'].includes(currentUser.role);
        const isOwnerDoctor = appointment.doctor_id === currentUser.id;

        if (!isStaff && !isOwnerDoctor) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await AppointmentService.softDeleteAppointment(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
