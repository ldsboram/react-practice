// app/page.js

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        // 로그인 성공 시 세션 정보를 설정하고 메모 페이지로 이동
        router.push('/notes')
      } else {
        const data = await res.json()
        alert(`로그인 실패: ${data.message}`)
      }
    } catch (error) {
      console.error('로그인 중 오류 발생:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Note App</h2>
        <div className="mb-4">
          <label className="block text-gray-700">ID</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => router.push('/register')}
          className="w-full mt-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
        >
          Register
        </button>
      </form>
    </div>
  )
}

export default Login
