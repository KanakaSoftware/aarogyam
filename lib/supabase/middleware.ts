import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshes session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define protected routes that require authentication
    const isProtectedRoute =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/patients') ||
        request.nextUrl.pathname.startsWith('/appointments') ||
        request.nextUrl.pathname.startsWith('/triage') ||
        request.nextUrl.pathname.startsWith('/treatment-plans') ||
        request.nextUrl.pathname.startsWith('/lab') ||
        request.nextUrl.pathname.startsWith('/reports') ||
        request.nextUrl.pathname.startsWith('/compliance') ||
        request.nextUrl.pathname.startsWith('/admin')

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

    if (isProtectedRoute && !user) {
        // no user, potentially redirect to login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    if (isAuthRoute && user) {
        // user is already logged in, redirect to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
