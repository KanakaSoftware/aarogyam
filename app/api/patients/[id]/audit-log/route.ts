import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/services/audit.service";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const logs = await AuditService.getLogsByEntity('patient', id);
        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching patient audit logs:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
