// middleware.js

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // 로그인 및 회원가입 페이지는 인증 없이 접근 가능
  if (pathname.startsWith('/api/auth') || pathname === '/' || pathname.startsWith('/register')) {
    return NextResponse.next()
  }

  // 쿠키에서 JWT 토큰 가져오기
  const token = request.cookies.get('token')?.value

  if (!token) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    request.user = decoded
    return NextResponse.next()
  } catch (error) {
    // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/notes/:path*', '/api/pages/:path*'],
}
