import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(favicon|ico|png|jpg|jpeg|svg|gif|webp|js|css)$/i)
  ) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
