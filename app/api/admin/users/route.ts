import { NextRequest, NextResponse } from 'next/server';
import { UserService, CreateUserData } from '@/services/user.service';
import { RoleName, UserStatus } from '@/types';

// GET /api/admin/users — list all users with search/filter
export async function GET(request: NextRequest) {
    try {
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const result = await UserService.getUsers({
            search: searchParams.get('search') || undefined,
            role: (searchParams.get('role') as RoleName) || undefined,
            status: (searchParams.get('status') as UserStatus) || undefined,
            page: Number(searchParams.get('page')) || 1,
            limit: Number(searchParams.get('limit')) || 20,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('GET /api/admin/users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
    }
}

// POST /api/admin/users — create a new user with password
export async function POST(request: NextRequest) {
    try {
        const currentUser = await UserService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, first_name, last_name, role, department } = body;

        // Validate required fields
        if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        if (!password) return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
        if (!first_name) return NextResponse.json({ error: 'First name is required.' }, { status: 400 });
        if (!last_name) return NextResponse.json({ error: 'Last name is required.' }, { status: 400 });
        if (!role) return NextResponse.json({ error: 'Role is required.' }, { status: 400 });
        if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

        const result = await UserService.createUser({ email, password, first_name, last_name, role, department } as CreateUserData);
        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/admin/users error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 400 });
    }
}
