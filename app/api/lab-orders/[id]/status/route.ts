import { NextResponse } from "next/server";
import { LabService } from "@/services/lab.service";
import { UserService } from "@/services/user.service";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await UserService.getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        
        if (!body.status) {
            return NextResponse.json({ error: "Missing status field" }, { status: 400 });
        }

        const updatedOrder = await LabService.updateLabOrderStatus(id, body.status);

        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        console.error("PUT /api/lab-orders/[id]/status error:", error);
        return NextResponse.json({ error: "Failed to update lab order status", details: error.message }, { status: 500 });
    }
}
