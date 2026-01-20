import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  const { username, password } = await request.json()

  // 필수 필드 검증
  if (!username || !password) {
    return NextResponse.json({ message: 'ID와 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return NextResponse.json({ message: '존재하지 않는 사용자입니다.' }, { status: 400 })
  }

  // 비밀번호 검증
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return NextResponse.json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 400 })
  }

  // JWT 생성
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' })

  // 쿠키에 토큰 설정
  const response = NextResponse.json({ message: '로그인 성공' }, { status: 200 })
  response.cookies.set('token', token, { httpOnly: true, path: '/' })

  return response
}
