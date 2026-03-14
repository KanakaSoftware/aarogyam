import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { RoleName, UserStatus } from '@/types';

// GET /api/admin/users/[id] — get single user
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const user = await UserService.getUserById(id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/admin/users/[id] — update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const updated = await UserService.updateUser(id, {
            first_name: body.first_name,
            last_name: body.last_name,
            role: body.role as RoleName,
            department: body.department,
            status: body.status as UserStatus,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('PATCH /api/admin/users/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// DELETE /api/admin/users/[id] — soft deactivate
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await UserService.deactivateUser(id);
        return NextResponse.json({ success: true, message: 'User deactivated.' });
    } catch (error: any) {
        console.error('DELETE /api/admin/users/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
