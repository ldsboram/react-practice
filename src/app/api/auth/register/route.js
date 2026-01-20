// src/app/api/auth/register/route.js

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request) {
  const { username, password, name } = await request.json()

  // 필수 필드 검증
  if (!username || !password || !name) {
    return NextResponse.json({ message: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  // 사용자명 중복 체크
  const existingUser = await prisma.user.findUnique({
    where: { username },
  })

  if (existingUser) {
    return NextResponse.json({ message: '이미 사용 중인 ID입니다.' }, { status: 400 })
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10)

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
    },
  })

  return NextResponse.json({ message: '회원가입 성공' }, { status: 201 })
}
