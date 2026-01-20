import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  // 쿠키에서 'token' 추출
  const token = request.cookies.get('token')?.value

  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true },
    })

    if (user && user.profileImageUrl) {
      return new Response(JSON.stringify({ imageUrl: user.profileImageUrl }), { status: 200 })
    }

    return new Response(JSON.stringify({ imageUrl: '/default-profile.png' }), { status: 200 })
  } catch (err) {
    console.error('JWT 검증 오류:', err)
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
  }
}
