import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Pseudo-rate limit (Production ready would use Redis, but we use an in-memory Map for MVP per instructions)
const cache = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string, endpoint: string, limit: number, windowMs: number): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const record = cache.get(key);
  if (!record) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > record.resetTime) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

const PROTECTED_PATHS = ['/dashboard', '/verify', '/batch', '/orders', '/history', '/wallet']

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const path = request.nextUrl.pathname;

  // Rate limit API routes (30 requests per minute)
  if (path.startsWith('/api/')) {
    const isAllowed = checkRateLimit(ip, path, 30, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
