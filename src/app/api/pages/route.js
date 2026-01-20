// app/api/pages/route.js

import { NextResponse } from 'next/server'
import prisma from '../../../../src/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  // 쿠키에서 토큰 가져오기
  const token = request.cookies.get('token')?.value

  if (!token) {
    console.error('토큰이 없습니다.')
    return NextResponse.json({ message: '인증되지 않음: 토큰 없음' }, { status: 401 })
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    console.error('JWT 검증 오류:', error.message)
    return NextResponse.json({ message: '유효하지 않은 토큰' }, { status: 401 })
  }

  const userId = decoded.userId

  try {
    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error('사용자를 찾을 수 없습니다. userId:', userId)
      return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 사용자의 메모 가져오기
    const pages = await prisma.page.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        content: true,
        isFavorite: true,
      },
    })

    return NextResponse.json({ pages, userName: user.name })
  } catch (error) {
    console.error('서버 오류 발생:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}

export async function POST(request) {
  const { title, content } = await request.json()
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ message: '인증되지 않음' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    const page = await prisma.page.create({
      data: {
        title,
        content,
        userId,
        isFavorite: false, // 기본값 설정
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('페이지 생성 중 오류:', error)
    return NextResponse.json({ message: '페이지 생성 실패' }, { status: 500 })
  }
}