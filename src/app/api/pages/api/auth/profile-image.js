// src/pages/api/auth/profile-image.js

import { getSession } from 'next-auth/react'

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // 사용자 정보에서 프로필 이미지 URL 가져오기
  const userId = session.user.id

  // 데이터베이스에서 사용자 정보 가져오기 (예시로 Prisma 사용)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImageUrl: true },
  })

  if (user && user.profileImageUrl) {
    res.status(200).json({ imageUrl: user.profileImageUrl })
  } else {
    res.status(200).json({ imageUrl: '/default-profile.png' })
  }
}
