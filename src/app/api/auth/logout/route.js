// app/api/auth/logout/route.js

import { NextResponse } from 'next/server'

export async function POST(request) {
  const response = NextResponse.json({ message: '로그아웃 성공' }, { status: 200 })
  response.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: -1 }) // 토큰 쿠키 삭제
  return response
}