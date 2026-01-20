'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import DOMPurify from 'dompurify'
import 'tailwindcss/tailwind.css'
import { visit } from 'unist-util-visit'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

function Notes() {
  // 상태 관리
  const [pages, setPages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState(0)
  const [userName, setUserName] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('/default-profile.png')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(true)
  const [editedContent, setEditedContent] = useState('')
  const router = useRouter()

  // 프로필 이미지 업로드 관련 상태
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  // 검색 관련 상태
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [highlightTerm, setHighlightTerm] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // TOC 관련 상태
  const [isTOCVisible, setIsTOCVisible] = useState(false)
  const [tocItems, setTocItems] = useState([])

  // 상태 추가
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [font, setFont] = useState('font1')

  // 사용자 설정 불러오기
  useEffect(() => {
    fetch('/api/user/settings')
      .then((res) => res.json())
      .then((data) => {
        setTheme(data.theme)
        setFont(data.font)
      })
      .catch((error) => {
        console.error('사용자 설정 불러오기 중 오류 발생:', error)
      })
  }, [])

  const handleSettingsSave = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, font }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsSettingsModalOpen(false)
        applyThemeAndFont(data.theme, data.font) // 서버에서 반환한 설정 사용
      } else {
        alert('설정 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('설정 저장 중 오류 발생:', error)
      alert('설정 저장 중 오류가 발생했습니다.')
    }
  }

  const applyThemeAndFont = (theme, font) => {
    // 테마 적용
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // 폰트 적용
    document.documentElement.classList.remove('font1', 'font2', 'font3')
    document.documentElement.classList.add(font)
  }

  // 초기 로드 시 테마와 폰트 적용
  useEffect(() => {
    applyThemeAndFont(theme, font)
  }, [theme, font])

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      if (a.isFavorite === b.isFavorite) {
        return a.id - b.id // ID로 추가 정렬
      }
      return b.isFavorite - a.isFavorite
    })
  }, [pages])

  // 즐겨찾기 토글 함수
  const toggleFavorite = async (pageId) => {
    const page = pages.find((p) => p.id === pageId)
    if (!page) return

    // content가 정의되어 있는지 확인하고, 없으면 빈 문자열 사용
    const content = page.content !== undefined ? page.content : ""

    const updatedPage = { ...page, isFavorite: !page.isFavorite, content }

    setPages(pages.map((p) => (p.id === pageId ? updatedPage : p)))

    // 서버에 업데이트 요청
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedPage.title,
          content: updatedPage.content, // 항상 정의된 content를 보냄
          isFavorite: updatedPage.isFavorite,
        }),
      })
      if (!res.ok) {
        console.error('즐겨찾기 상태 업데이트 실패')
      }
    } catch (error) {
      console.error('즐겨찾기 상태 업데이트 중 오류 발생:', error)
    }
  }

  // 프로필 이미지 로드
  useEffect(() => {
    fetch('/api/auth/profile-image')
      .then((res) => res.json())
      .then((data) => {
        if (data.imageUrl) {
          setProfileImageUrl(`${data.imageUrl}?timestamp=${Date.now()}`)
        }
      })
      .catch((error) => {
        console.error('프로필 이미지 로드 중 오류 발생:', error)
      })
  }, [])

  // 이미지 선택 핸들러
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  // 이미지 업로드 핸들러
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('이미지를 선택하세요.')
      return
    }

    const formData = new FormData()
    formData.append('profileImage', selectedFile)

    try {
      const res = await fetch('/api/auth/upload-profile-image', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        alert('프로필 이미지가 변경되었습니다.')
        setProfileImageUrl(`${data.imageUrl}?timestamp=${Date.now()}`)
        setIsProfileModalOpen(false)
        setSelectedFile(null)
      } else {
        const errorData = await res.json()
        alert(`이미지 업로드 실패: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('이미지 업로드 중 오류 발생:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    }
  }

  // 페이지 로드
  useEffect(() => {
    fetch('/api/pages')
      .then(async (res) => {
        if (res.status === 401) {
          // 인증되지 않은 경우 로그인 페이지로 이동
          router.push('/')
          return
        }
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(`서버 오류: ${res.status} ${errorData.message}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setPages(data.pages)
          setUserName(data.userName)
          if (data.pages.length > 0) {
            setSelectedPageId(data.pages[0].id)
            setEditedContent(data.pages[0].content)
          }
        }
      })
      .catch((error) => {
        console.error('페이지 로드 중 오류 발생:', error)
        alert(`페이지 로드 중 오류가 발생했습니다: ${error.message}`)
      })
  }, [router])

  // 선택된 페이지 정의
  const selectedPage = pages.find((page) => page.id === selectedPageId)

  // 선택된 페이지 변경 시 콘텐츠 및 TOC 업데이트
  useEffect(() => {
    if (selectedPage) {
      setEditedContent(selectedPage.content)
      const headings = extractHeadings(selectedPage.content)
      setTocItems(headings)
    }
  }, [selectedPage])

  // 페이지 추가 함수
  const addNewPage = () => {
    fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Untitled ${pages.length + 1}`, content: '' }),
    })
      .then((res) => res.json())
      .then((newPage) => {
        setPages([...pages, newPage])
        setSelectedPageId(newPage.id)
        setIsEditing(true)
      })
      .catch((error) => {
        console.error('새 페이지 추가 중 오류 발생:', error)
        alert('새 페이지 추가 중 오류가 발생했습니다.')
      })
  }

  // 페이지 업데이트 함수
  const updatePage = async (updatedPage) => {
    try {
      const res = await fetch(`/api/pages/${updatedPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPage),
      })
      if (!res.ok) {
        const errorData = await res.json()
        alert(`페이지 업데이트 실패: ${errorData.message}`)
      }
    } catch (error) {
      console.error('페이지 업데이트 중 오류 발생:', error)
      alert('페이지 업데이트 중 오류가 발생했습니다.')
    }
  }

  // 제목 업데이트 함수
  const updateTitle = (newTitle) => {
    if (!selectedPage) return
    const updatedPage = { ...selectedPage, title: newTitle }
    setPages(pages.map((page) => (page.id === selectedPageId ? updatedPage : page)))
    updatePage(updatedPage)
  }

  // 내용 업데이트 함수
  const updateContent = (newContent) => {
    if (!selectedPage) return
    const updatedPage = { ...selectedPage, content: newContent }
    setPages(pages.map((page) => (page.id === selectedPageId ? updatedPage : page)))
    setEditedContent(newContent)
    updatePage(updatedPage)
  }

  // 페이지 삭제 함수
  const deletePage = async (id) => {
    const confirmDelete = confirm('정말 이 페이지를 삭제하시겠습니까?')
    if (!confirmDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        if (res.status === 204) {
          const updatedPages = pages.filter((page) => page.id !== id)
          setPages(updatedPages)

          if (id === selectedPageId) {
            if (updatedPages.length > 0) {
              setSelectedPageId(updatedPages[0].id)
            } else {
              setSelectedPageId(0)
              setEditedContent('')
            }
          }
        }
      } else {
        let errorMessage = `삭제 실패: ${res.status} ${res.statusText}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorMessage
        } catch (err) {}
        alert(errorMessage)
      }
    } catch (error) {
      console.error('삭제 중 오류 발생:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (res.ok) {
        router.push('/')
      } else {
        alert('로그아웃 실패')
      }
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // Edit/View 모드 전환 함수
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false)
      updateContent(editedContent)
    } else {
      setIsEditing(true)
    }
  }

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault()
    const term = searchTerm.trim()
    setHasSearched(true)
    if (!term) {
      setSearchResults([])
      return
    }
    const regex = new RegExp(`(${term})`, 'gi')
    const resultsMap = new Map()

    pages.forEach((page) => {
      const matches = page.content.match(regex)
      if (matches) {
        resultsMap.set(page.id, { id: page.id, title: page.title, matchCount: matches.length, word: term })
      }
    })

    const results = Array.from(resultsMap.values())
    setSearchResults(results)
  }

  // 검색 결과 클릭 핸들러
  const handleResultClick = (pageId) => {
    setSelectedPageId(pageId)
    setHighlightTerm(searchTerm.trim())
    setIsEditing(false)
    setIsSearchActive(false)
  }

  // 커스텀 remark 플러그인 정의
  function remarkHighlight(searchTerm) {
    return () => (tree) => {
      if (!searchTerm) return
      visit(tree, 'text', (node, index, parent) => {
        const regex = new RegExp(`(${searchTerm})`, 'gi')
        const { value } = node
        const parts = value.split(regex)
        if (parts.length > 1) {
          const newNodes = parts.map((part) => {
            if (regex.test(part)) {
              return {
                type: 'html',
                value: `<span class="bg-yellow-300 font-bold text-yellow-800">${part}</span>`,
              }
            } else {
              return { type: 'text', value: part }
            }
          })
          parent.children.splice(index, 1, ...newNodes)
          return index + newNodes.length
        }
      })
    }
  }

  // 마크다운 헤딩 추출 함수
  const extractHeadings = (markdown) => {
    const headings = []
    const processor = unified().use(remarkParse)
    const tree = processor.parse(markdown)

    visit(tree, 'heading', (node) => {
      const text = node.children
        .filter((child) => child.type === 'text' || child.type === 'inlineCode')
        .map((child) => child.value)
        .join('')

      headings.push({ level: node.depth, text })
    })

    return headings
  }

  // 헤딩으로 스크롤 이동 함수
  const scrollToHeading = (headingText) => {
    const headingId = headingText.replace(/\s+/g, '-').toLowerCase()
    const headingElement = document.getElementById(headingId)
    if (headingElement) {
      headingElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 검색 모달 닫힐 때 highlightTerm 초기화
  const closeSearchModal = () => {
    setIsSearchActive(false)
    setSearchTerm('')
    setSearchResults([])
    setHighlightTerm('')
    setHasSearched(false)
  }

  return (
    <div className={`flex h-screen font-${font}`}>{/* 폰트 클래스 추가 */}
      {/* 왼쪽 사이드바 */}
      <nav className="bg-yellow-50 dark:bg-gray-800 w-60 flex flex-col p-2">
        {/* 사용자 정보 및 로그아웃 버튼 */}
        <div className="flex items-center p-2">
          <img
            src={profileImageUrl}
            alt="Profile"
            className="w-6 h-6 rounded-md mr-2 cursor-pointer"
            onClick={() => setIsProfileModalOpen(true)}
          />
          <p
            id="name"
            className="text-sm font-semibold cursor-pointer text-gray-800 dark:text-gray-200"
            onClick={() => setIsProfileModalOpen(true)}
          >
            {userName}
          </p>
        </div>

        {/* "Search" 버튼 */}
        <div
          className="flex items-center p-2 cursor-pointer rounded-lg mb-1"
          onClick={() => {
            setIsSearchActive(true)
            setSearchTerm('')
            setSearchResults([])
            setHighlightTerm('')
            setHasSearched(false) // 검색 상태 초기화
          }}
          aria-label="Open search modal"
        >
          <svg role="graphics-symbol" viewBox="0 0 20 20" className="w-5 mr-2 dark:fill-gray-200">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4 8.75C4 6.12665 6.12665 4 8.75 4C11.3734 4 13.5 6.12665 13.5 8.75C13.5 11.3734 11.3734 13.5 8.75 13.5C6.12665 13.5 4 11.3734 4 8.75ZM8.75 2.5C5.29822 2.5 2.5 5.29822 2.5 8.75C2.5 12.2018 5.29822 15 8.75 15C10.2056 15 11.545 14.5024 12.6073 13.668L16.7197 17.7803C17.0126 18.0732 17.4874 18.0732 17.7803 17.7803C18.0732 17.4874 18.0732 17.0126 17.7803 16.7197L13.668 12.6073C14.5024 11.545 15 10.2056 15 8.75C15 5.29822 12.2018 2.5 8.75 2.5Z"
            ></path>
          </svg>
          <p id="menu" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Search
          </p>
        </div>

        {/* "Logout" 버튼 */}
        <div className="flex items-center p-2 cursor-pointer" onClick={handleLogout}>
          <svg role="graphics-symbol" viewBox="0 0 20 20" className="w-5 mr-2 dark:fill-gray-200">
            <path d="M10.1416 3.77299C10.0563 3.71434 9.94368 3.71434 9.85837 3.77299L3.60837 8.06989C3.54053 8.11653 3.5 8.19357 3.5 8.2759V14.2499C3.5 14.9402 4.05964 15.4999 4.75 15.4999H7.5L7.5 10.7499C7.5 10.0595 8.05964 9.49987 8.75 9.49987H11.25C11.9404 9.49987 12.5 10.0595 12.5 10.7499L12.5 15.4999H15.25C15.9404 15.4999 16.5 14.9402 16.5 14.2499V8.2759C16.5 8.19357 16.4595 8.11653 16.3916 8.06989L10.1416 3.77299ZM9.00857 2.53693C9.60576 2.12636 10.3942 2.12636 10.9914 2.53693L17.2414 6.83383C17.7163 7.1603 18 7.69963 18 8.2759V14.2499C18 15.7687 16.7688 16.9999 15.25 16.9999H12.25C11.5596 16.9999 11 16.4402 11 15.7499L11 10.9999H9L9 15.7499C9 16.4402 8.44036 16.9999 7.75 16.9999H4.75C3.23122 16.9999 2 15.7687 2 14.2499V8.2759C2 7.69963 2.2837 7.1603 2.75857 6.83383L9.00857 2.53693Z"></path>
          </svg>
          <p id="menu" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Logout
          </p>
        </div>

        {/* 빈 공간 */}
        <div id="menu">ㅤ</div>

        {/* "Private" 레이블 */}
        <div className="flex items-center p-2">
          <p id="private" className="text-xs font-bold text-gray-600 dark:text-gray-300">
            Private
          </p>
        </div>

        {/* 메모 목록 */}
        <div className="flex-1 overflow-y-auto">
          {sortedPages.map((page) => (
            <div
              key={page.id}
              className={`group page-item flex items-center p-2 cursor-pointer rounded-lg mb-1 ${
                selectedPageId === page.id ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              onClick={() => {
                setSelectedPageId(page.id)
                setIsEditing(true)
                setHighlightTerm('')
              }}
            >
              {/* 기존 아이콘 */}
              <svg role="graphics-symbol" viewBox="0 0 16 16" className="w-5 h-5 rounded-md mr-2 dark:fill-gray-200">
                <path d="M4.35645 15.4678H11.6367C13.0996 15.4678 13.8584 14.6953 13.8584 13.2256V7.02539C13.8584 6.0752 13.7354 5.6377 13.1406 5.03613L9.55176 1.38574C8.97754 0.804688 8.50586 0.667969 7.65137 0.667969H4.35645C2.89355 0.667969 2.13477 1.44043 2.13477 2.91016V13.2256C2.13477 14.7021 2.89355 15.4678 4.35645 15.4678ZM4.46582 14.1279C3.80273 14.1279 3.47461 13.7793 3.47461 13.1436V2.99219C3.47461 2.36328 3.80273 2.00781 4.46582 2.00781H7.37793V5.75391C7.37793 6.73145 7.86328 7.20312 8.83398 7.20312H12.5186V13.1436C12.5186 13.7793 12.1836 14.1279 11.5205 14.1279H4.46582ZM8.95703 6.02734C8.67676 6.02734 8.56055 5.9043 8.56055 5.62402V2.19238L12.334 6.02734H8.95703ZM10.4336 9.00098H5.42969C5.16992 9.00098 4.98535 9.19238 4.98535 9.43164C4.98535 9.67773 5.16992 9.86914 5.42969 9.86914H10.4336C10.6797 9.86914 10.8643 9.67773 10.8643 9.43164C10.8643 9.19238 10.6797 9.00098 10.4336 9.00098ZM10.4336 11.2979H5.42969C5.16992 11.2979 4.98535 11.4893 4.98535 11.7354C4.98535 11.9746 5.16992 12.1592 5.42969 12.1592H10.4336C10.6797 12.1592 10.8643 11.9746 10.8643 11.7354C10.8643 11.4893 10.6797 11.2979 10.4336 11.2979Z"></path>
              </svg>
              {/* 페이지 제목 */}
              <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm flex-1">{page.title}</p>
              {/* 즐겨찾기 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(page.id)
                }}
                className={`ml-2 ${
                  page.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity duration-200`}
                aria-label={`Toggle favorite for ${page.title}`}
              >
                {page.isFavorite ? (
                  // 채워진 별 아이콘
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.971a1 1 0 00.95.69h4.2c.969 0 1.371 1.24.588 1.81l-3.4 2.472a1 1 0 00-.364 1.118l1.286 3.971c.3.921-.755 1.688-1.54 1.118l-3.4-2.472a1 1 0 00-1.176 0l-3.4 2.472c-.784.57-1.838-.197-1.54-1.118l1.286-3.971a1 1 0 00-.364-1.118L2.014 9.398c-.783-.57-.38-1.81.588-1.81h4.2a1 1 0 00.95-.69l1.286-3.971z" />
                  </svg>
                ) : (
                  // 테두리 별 아이콘
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.971a1 1 0 00.95.69h4.2c.969 0 1.371 1.24.588 1.81l-3.4 2.472a1 1 0 00-.364 1.118l1.286 3.971c.3.921-.755 1.688-1.54 1.118l-3.4-2.472a1 1 0 00-1.176 0l-3.4 2.472c-.784.57-1.838-.197-1.54-1.118l1.286-3.971a1 1 0 00-.364-1.118L2.014 9.398c-.783-.57-.38-1.81.588-1.81h4.2a1 1 0 00.95-.69l1.286-3.971z"
                    />
                  </svg>
                )}
              </button>
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deletePage(page.id)
                }}
                className="text-red-500 hover:text-red-700 ml-2"
                aria-label={`Delete ${page.title}`}
              >
                &times;
              </button>
            </div>
          ))}

          {/* 새 페이지 추가 버튼 */}
          <div
            className="flex items-center p-2 cursor-pointer rounded-lg mb-1"
            onClick={addNewPage}
          >
            <svg role="graphics-symbol" viewBox="0 0 16 16" className="w-5 h-5 rounded-md mr-2 dark:fill-gray-200">
              <path d="M4.35645 15.4678H11.6367C13.0996 15.4678 13.8584 14.6953 13.8584 13.2256V7.02539C13.8584 6.0752 13.7354 5.6377 13.1406 5.03613L9.55176 1.38574C8.97754 0.804688 8.50586 0.667969 7.65137 0.667969H4.35645C2.89355 0.667969 2.13477 1.44043 2.13477 2.91016V13.2256C2.13477 14.7021 2.89355 15.4678 4.35645 15.4678ZM4.46582 14.1279C3.80273 14.1279 3.47461 13.7793 3.47461 13.1436V2.99219C3.47461 2.36328 3.80273 2.00781 4.46582 2.00781H7.37793V5.75391C7.37793 6.73145 7.86328 7.20312 8.83398 7.20312H12.5186V13.1436C12.5186 13.7793 12.1836 14.1279 11.5205 14.1279H4.46582ZM8.95703 6.02734C8.67676 6.02734 8.56055 5.9043 8.56055 5.62402V2.19238L12.334 6.02734H8.95703ZM10.4336 9.00098H5.42969C5.16992 9.00098 4.98535 9.19238 4.98535 9.43164C4.98535 9.67773 5.16992 9.86914 5.42969 9.86914H10.4336C10.6797 9.86914 10.8643 9.67773 10.8643 9.43164C10.8643 9.19238 10.6797 9.00098 10.4336 9.00098ZM10.4336 11.2979H5.42969C5.16992 11.2979 4.98535 11.4893 4.98535 11.7354C4.98535 11.9746 5.16992 12.1592 5.42969 12.1592H10.4336C10.6797 12.1592 10.8643 11.9746 10.8643 11.7354C10.8643 11.4893 10.6797 11.2979 10.4336 11.2979Z"></path>
            </svg>
            <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm">New Page</p>
          </div>
        </div>
      </nav>

      {/* 설정 모달 JSX 추가 */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-1/3">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">설정</h2>
            <form onSubmit={handleSettingsSave}>
              {/* 테마 선택 */}
              <div className="mb-4">
                <label className="font-bold text-gray-800 dark:text-gray-200">테마:</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              {/* 폰트 선택 */}
              <div className="mb-4">
                <label className="font-bold text-gray-800 dark:text-gray-200">폰트:</label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="font1">Roboto</option>
                  <option value="font2">Open Sans</option>
                  <option value="font3">Lato</option>
                </select>
              </div>
              {/* 버튼들 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 프로필 이미지 업로드 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-1/3">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Upload Image to Change Your Profile Image</h2>
            <form onSubmit={handleUpload} className="flex flex-col items-center">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <div className="mt-4">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false)
                    setSelectedFile(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 검색 모달 */}
      {isSearchActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-1/2">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Search</h2>
            <form onSubmit={handleSearch} className="mb-4">
              <label className="font-bold text-gray-800 dark:text-gray-200">Search Word:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="Enter search word"
                autoFocus
              />
              <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
                Search
              </button>
            </form>
            <button
              onClick={closeSearchModal}
              className="text-red-500 mb-4"
            >
              Close
            </button>
            <div>
              {hasSearched ? (
                searchResults.length > 0 ? (
                  <div>
                    <p className="font-bold mb-2 text-gray-800 dark:text-gray-200">
                      Search Word: <span className="font-bold">{searchResults[0].word}</span>
                    </p>
                    {searchResults.map((result) => (
                      <div key={result.id} className="mb-2">
                        <button
                          onClick={() => handleResultClick(result.id)}
                          className="text-blue-500 underline"
                        >
                          <span className="font-bold">{result.title}:</span> '{result.word}' 발견 ({result.matchCount}회)
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200">검색 결과가 없습니다.</p>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <section
        id="content"
        className="flex-1 px-40 py-20 bg-white dark:bg-gray-900 shadow-md overflow-y-auto"
      >
        {selectedPage && (
          <div id="present" className="p-5">
          <input
            type="text"
            value={selectedPage.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="block w-full text-4xl font-bold mb-4 pb-2 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 rounded"
          />
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleEditMode}
              className="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-800"
            >
              {isEditing ? 'View' : 'Edit'}
            </button>
          </div>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onBlur={() => updateContent(editedContent)}
              className="w-full h-[60vh] p-5 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200"
            ></textarea>
          ) : (
            <ReactMarkdown
              className="prose dark:prose-dark dark:text-gray-200"
              remarkPlugins={[
                remarkGfm,
                remarkHighlight(highlightTerm),
                () => (tree) => {
                  visit(tree, 'heading', (node) => {
                    const text = node.children
                      .filter((child) => child.type === 'text' || child.type === 'inlineCode')
                      .map((child) => child.value)
                      .join('')
        
                    const id = text.replace(/\s+/g, '-').toLowerCase()
                    node.data = {
                      hProperties: {
                        id,
                        className:"dark:text-gray-200"
                      },
                    }
                  })

                  // Strong (굵은 글씨) 스타일 추가
                  visit(tree, 'strong', (node) => {
                    node.data = {
                      hProperties: {
                        className:"dark:text-gray-200"
                      },
                    };
                  });

                  visit(tree, 'tableCell', (node) => {
                    node.data = {
                      hProperties: {
                        className:"dark:text-gray-200"
                      },
                    };
                  });
                },
              ]}
              rehypePlugins={[rehypeRaw]}
            >
              {DOMPurify.sanitize(editedContent)}
            </ReactMarkdown>
          )}
        </div>
        
        )}
      </section>

      {/* 오른쪽 사이드바 */}
      <aside className="bg-yellow-50 dark:bg-gray-800 w-60 flex flex-col p-2">
        {/* 설정 버튼 */}
        <div
          className="flex items-center p-2 cursor-pointer rounded-lg mb-1"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px" className="w-5 mr-2 dark:fill-gray-200">    <path d="M 10.490234 2 C 10.011234 2 9.6017656 2.3385938 9.5097656 2.8085938 L 9.1757812 4.5234375 C 8.3550224 4.8338012 7.5961042 5.2674041 6.9296875 5.8144531 L 5.2851562 5.2480469 C 4.8321563 5.0920469 4.33375 5.2793594 4.09375 5.6933594 L 2.5859375 8.3066406 C 2.3469375 8.7216406 2.4339219 9.2485 2.7949219 9.5625 L 4.1132812 10.708984 C 4.0447181 11.130337 4 11.559284 4 12 C 4 12.440716 4.0447181 12.869663 4.1132812 13.291016 L 2.7949219 14.4375 C 2.4339219 14.7515 2.3469375 15.278359 2.5859375 15.693359 L 4.09375 18.306641 C 4.33275 18.721641 4.8321562 18.908906 5.2851562 18.753906 L 6.9296875 18.1875 C 7.5958842 18.734206 8.3553934 19.166339 9.1757812 19.476562 L 9.5097656 21.191406 C 9.6017656 21.661406 10.011234 22 10.490234 22 L 13.509766 22 C 13.988766 22 14.398234 21.661406 14.490234 21.191406 L 14.824219 19.476562 C 15.644978 19.166199 16.403896 18.732596 17.070312 18.185547 L 18.714844 18.751953 C 19.167844 18.907953 19.66625 18.721641 19.90625 18.306641 L 21.414062 15.691406 C 21.653063 15.276406 21.566078 14.7515 21.205078 14.4375 L 19.886719 13.291016 C 19.955282 12.869663 20 12.440716 20 12 C 20 11.559284 19.955282 11.130337 19.886719 10.708984 L 21.205078 9.5625 C 21.566078 9.2485 21.653063 8.7216406 21.414062 8.3066406 L 19.90625 5.6933594 C 19.66725 5.2783594 19.167844 5.0910937 18.714844 5.2460938 L 17.070312 5.8125 C 16.404116 5.2657937 15.644607 4.8336609 14.824219 4.5234375 L 14.490234 2.8085938 C 14.398234 2.3385937 13.988766 2 13.509766 2 L 10.490234 2 z M 12 8 C 14.209 8 16 9.791 16 12 C 16 14.209 14.209 16 12 16 C 9.791 16 8 14.209 8 12 C 8 9.791 9.791 8 12 8 z"/></svg>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Settings</p>
        </div>
        {/* TOC 버튼 */}
        <div
          className="flex items-center p-2 cursor-pointer rounded-lg mb-1"
          onClick={() => setIsTOCVisible(!isTOCVisible)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="25px" viewBox="0 0 20 24" version="1.1" className="w-5 mr-2 dark:fill-gray-200">
          <g id="surface1">
          <path d="M 17.785156 3.59375 L 17.785156 23.269531 C 17.785156 23.652344 17.457031 23.96875 17.050781 23.96875 L 14.863281 23.96875 C 14.460938 23.96875 14.132812 23.652344 14.132812 23.269531 L 14.132812 3.59375 L 11.628906 3.59375 L 11.628906 23.265625 C 11.628906 23.652344 11.300781 23.96875 10.898438 23.96875 L 8.710938 23.96875 C 8.308594 23.96875 7.980469 23.652344 7.980469 23.265625 L 7.980469 15.421875 L 7.902344 15.421875 C 3.539062 15.421875 0 11.96875 0 7.714844 C 0 2.78125 4.082031 0.03125 8.734375 0.03125 L 19.269531 0.03125 C 19.671875 0.03125 20 0.351562 20 0.742188 L 20 2.882812 C 20 3.273438 19.671875 3.59375 19.269531 3.59375 Z M 17.785156 3.59375 "/>
          </g>
          </svg>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{isTOCVisible ? 'Hide TOC' : 'Show TOC'}</p>
        </div>

        {/* TOC 내용 */}
        {isTOCVisible && (
          <div className="overflow-y-auto text-gray-800 dark:text-gray-200">
            <h2 className="text-lg font-bold mb-2">
              {selectedPage ? selectedPage.title : 'No Page Selected'}
            </h2>
            {tocItems.map((item, index) => (
              <div
                key={index}
                className="text-sm mb-1 cursor-pointer hover:underline"
                style={{ paddingLeft: `${(item.level - 1) * 10}px` }}
                onClick={() => scrollToHeading(item.text)}
              >
                <span>{'·'} </span>
                {item.text}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}

export default Notes
