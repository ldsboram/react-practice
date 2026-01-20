// app/api/user/settings/route.js

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ message: '인증되지 않음' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { theme: true, font: true },
    })

    if (!user) {
      return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ theme: user.theme, font: user.font })
  } catch (error) {
    console.error('사용자 설정 가져오기 중 오류 발생:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}

export async function POST(request) {
    const token = request.cookies.get('token')?.value
  
    if (!token) {
      return NextResponse.json({ message: '인증되지 않음' }, { status: 401 })
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId = decoded.userId
      const { theme, font } = await request.json()
  
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { theme, font },
      })
  
      return NextResponse.json({ theme: updatedUser.theme, font: updatedUser.font })
    } catch (error) {
      console.error('사용자 설정 업데이트 중 오류 발생:', error)
      return NextResponse.json({ message: '서버 오류' }, { status: 500 })
    }
  }
  