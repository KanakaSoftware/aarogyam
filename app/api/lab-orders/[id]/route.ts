import { NextResponse } from "next/server";
import { LabService } from "@/services/lab.service";
import { UserService } from "@/services/user.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Invalid lab order ID format" }, { status: 400 });
        }

        const user = await UserService.getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await LabService.getLabOrderById(id);
        if (!data) {
            return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GET /api/lab-orders/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch lab order details", details: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Invalid lab order ID format" }, { status: 400 });
        }

        const user = await UserService.getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Allow updating test_name and notes
        const updatedOrder = await LabService.updateLabOrder(id, {
            test_name: body.test_name,
            notes: body.notes
        });

        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        console.error("PUT /api/lab-orders/[id] error:", error);
        return NextResponse.json({ error: "Failed to update lab order", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Invalid lab order ID format" }, { status: 400 });
        }

        const user = await UserService.getCurrentUser();
        if (!user || user.role !== 'doctor' && user.role !== 'admin' && user.role !== 'specialist') {
            return NextResponse.json({ error: "Unauthorized to delete lab orders" }, { status: 403 });
        }

        await LabService.deleteLabOrder(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE /api/lab-orders/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete lab order", details: error.message }, { status: 500 });
    }
}
