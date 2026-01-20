// app/api/pages/[id]/route.js

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(request, { params }) {
  const { id } = await params
  const { title, content, isFavorite } = await request.json()
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ message: '인증되지 않음' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    // 해당 메모가 현재 사용자 소유인지 확인
    const page = await prisma.page.findUnique({
      where: { id: parseInt(id) },
    })

    if (!page || page.userId !== userId) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 })
    }

    const updatedPage = await prisma.page.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        isFavorite, // 즐겨찾기 상태 업데이트
      },
    })

    return NextResponse.json(updatedPage)
  } catch (error) {
    console.error('페이지 업데이트 중 오류:', error)
    return NextResponse.json({ message: '페이지 업데이트 실패' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ message: '인증되지 않음' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    // 해당 메모가 현재 사용자 소유인지 확인
    const page = await prisma.page.findUnique({
      where: { id: parseInt(id) },
    })

    if (!page || page.userId !== userId) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 })
    }

    await prisma.page.delete({
      where: { id: parseInt(id) },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('페이지 삭제 중 오류:', error)
    return NextResponse.json({ message: '페이지 삭제 실패' }, { status: 500 })
  }
}
