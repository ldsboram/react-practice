import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { Readable } from 'node:stream'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function convertToNodeRequest(req) {
  const body = await req.arrayBuffer()
  const stream = new Readable()
  stream._read = () => {}
  stream.push(Buffer.from(body))
  stream.push(null)
  stream.headers = Object.fromEntries(req.headers)
  stream.method = req.method
  return stream
}

async function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Formidable parse error:', err);
        reject(err);
      } else {
        //console.log('Parsed fields:', fields); // 디버깅
        //console.log('Parsed files:', files); // 디버깅
        resolve({ fields, files });
      }
    });
  });
}

export async function POST(request) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId

    const nodeReq = await convertToNodeRequest(request)
    const { files } = await parseForm(nodeReq)

    // 배열 형태의 파일 데이터에서 첫 번째 파일 참조
    const fileArray = files.profileImage
    if (!fileArray || !fileArray.length) {
      return NextResponse.json({ message: 'No file uploaded or invalid file data' }, { status: 400 })
    }

    const file = fileArray[0] // 첫 번째 파일 추출

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.mimetype)) {
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath)
      }
      return NextResponse.json({ message: 'Unsupported file type' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = `${userId}-${Date.now()}${path.extname(file.originalFilename)}`
    const filePath = path.join(uploadDir, fileName)

    fs.renameSync(file.filepath, filePath)

    const imageUrl = `/uploads/${fileName}`

    await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: imageUrl },
    })

    return NextResponse.json({ success: true, imageUrl }, { status: 200 })
  } catch (err) {
    console.error('Error during file upload:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
