import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import useScrollReveal from './hooks/useScrollReveal'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import StudentProfilePage from './pages/StudentProfilePage'
import AdminPage from './pages/AdminPage'
import {
  defaultHomePageContentByLanguage,
  getDateLocale,
  getInitialLanguage,
  getUiText,
  LANGUAGE_STORAGE_KEY,
  supportedLanguages,
} from './data/translations'
import { apiRequest, getAssetUrl } from './utils/api'
import { getPostMediaCount, getPostMediaItems, normalizePostMediaCollection } from './utils/postMedia'
import readVideoDuration from './utils/readVideoDuration'
import './styles/app.css'

const TOKEN_STORAGE_KEY = 'def-auth-token'
const MOBILE_NAV_BREAKPOINT = 900

const placeholderStudents = [
  { id: 'placeholder-1', fullName: 'Nadine M.', major1: 'French Literature', major2: 'Media Studies', academicYear: '2025-2026', avatarUrl: '' },
  { id: 'placeholder-2', fullName: 'Jean P.', major1: 'Translation', major2: 'International Studies', academicYear: '2025-2026', avatarUrl: '' },
  { id: 'placeholder-3', fullName: 'Aissatou R.', major1: 'Linguistics', major2: 'Journalism', academicYear: '2025-2026', avatarUrl: '' },
  { id: 'placeholder-4', fullName: 'Blaise K.', major1: 'French Education', major2: 'History', academicYear: '2025-2026', avatarUrl: '' },
]

function getStudentsPerPage(viewportWidth) {
  if (viewportWidth >= 1280) {
    return 6
  }

  if (viewportWidth >= 1024) {
    return 4
  }

  if (viewportWidth >= 640) {
    return 2
  }

  return 1
}

function normalizeStudent(student) {
  return {
    id: student.id,
    fullName: student.fullName,
    major1: student.major1 || '',
    major2: student.major2 || '',
    academicYear: student.academicYear || '2025-2026',
    bio: student.bio || '',
    location: student.location || '',
    avatarUrl: student.avatarUrl || '',
    posts: normalizePostMediaCollection(student.posts),
  }
}

function normalizeAdminStudent(student) {
  return {
    ...normalizeStudent(student),
    email: student.email || '',
    role: student.role || 'student',
  }
}

function normalizeAuthenticatedUser(user) {
  return {
    ...normalizeAdminStudent(user),
    email: user?.email || '',
    role: user?.role || 'student',
  }
}

function buildStudentGalleryHighlights(students) {
  return students
    .map((student) => {
      const galleryPosts = [...student.posts]
        .filter((post) => getPostMediaItems(post).length)
        .sort((leftPost, rightPost) => new Date(rightPost.createdAt || 0) - new Date(leftPost.createdAt || 0))

      const latestPost = galleryPosts[0]

      if (!latestPost) {
        return null
      }

      const latestPostMedia = getPostMediaItems(latestPost)
      const previewMediaItem = latestPostMedia[0] || (student.avatarUrl ? { type: 'image', url: student.avatarUrl } : null)

      return {
        id: student.id,
        studentId: student.id,
        fullName: student.fullName,
        previewMediaItem,
        media: latestPostMedia,
        caption: latestPost.caption || '',
        createdAt: latestPost.createdAt || '',
        totalPhotos: student.posts.reduce((mediaCount, post) => mediaCount + getPostMediaCount(post), 0),
      }
    })
    .filter(Boolean)
    .sort((leftHighlight, rightHighlight) => new Date(rightHighlight.createdAt || 0) - new Date(leftHighlight.createdAt || 0))
    .slice(0, 9)
}

function readContentValue(value, fallback = '') {
  return value == null ? fallback : value
}

function normalizeSiteContent(content, fallbackContent) {
  const fallback = fallbackContent
  const heroSlides = Array.isArray(content?.heroSlides) && content.heroSlides.length ? content.heroSlides : fallback.heroSlides
  const eventRows = Array.isArray(content?.eventRows) && content.eventRows.length ? content.eventRows : fallback.eventRows

  return {
    heroSlides: heroSlides.map((slide, index) => ({
      id: slide.id || fallback.heroSlides[index]?.id || `hero-${index + 1}`,
      title: readContentValue(slide?.title, fallback.heroSlides[index]?.title || ''),
      subtitle: readContentValue(slide?.subtitle, fallback.heroSlides[index]?.subtitle || ''),
      caption: readContentValue(slide?.caption, fallback.heroSlides[index]?.caption || ''),
      imageUrl: readContentValue(slide?.imageUrl, fallback.heroSlides[index]?.imageUrl || ''),
    })),
    eventRows: eventRows.map((eventRow, index) => ({
      id: eventRow.id || fallback.eventRows[index]?.id || `event-${index + 1}`,
      description: readContentValue(eventRow?.description, fallback.eventRows[index]?.description || ''),
      imageUrl: readContentValue(eventRow?.imageUrl, fallback.eventRows[index]?.imageUrl || ''),
    })),
    footer: {
      title: readContentValue(content?.footer?.title, fallback.footer.title),
      description: readContentValue(content?.footer?.description, fallback.footer.description),
    },
  }
}

function createProfileForm(user) {
  return {
    fullName: user?.fullName || '',
    academicYear: user?.academicYear || '2025-2026',
    major1: user?.major1 || '',
    major2: user?.major2 || '',
    bio: user?.bio || '',
    location: user?.location || '',
  }
}

function createPasswordForm() {
  return {
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  }
}

async function fetchStudentsList() {
  const payload = await apiRequest('/api/students')
  return payload.students.map(normalizeStudent)
}

async function fetchAdminStudents(token) {
  const payload = await apiRequest('/api/admin/students', { token })
  return payload.students.map(normalizeAdminStudent)
}

async function fetchSiteContent() {
  const payload = await apiRequest('/api/site-content')
  return payload.content
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => getInitialLanguage())
  const uiText = getUiText(language)
  const dateLocale = getDateLocale(language)
  const defaultHomePageContent = defaultHomePageContentByLanguage[language] || defaultHomePageContentByLanguage.en
  const navigationLinks = [
    { label: uiText.nav.events, to: '/#events' },
    { label: uiText.nav.photos, to: '/#photos' },
    { label: uiText.nav.profile, to: '/profile' },
    { label: uiText.nav.students, to: '/#students' },
  ]

  useScrollReveal(`${location.pathname}${location.hash}`)

  const studentSwipeStartX = useRef(0)
  const [activeSlide, setActiveSlide] = useState(0)
  const [studentsPerPage, setStudentsPerPage] = useState(() => getStudentsPerPage(window.innerWidth))
  const [activeStudentPage, setActiveStudentPage] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [students, setStudents] = useState([])
  const [adminStudents, setAdminStudents] = useState([])
  const [siteContentSource, setSiteContentSource] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
  })
  const [profileForm, setProfileForm] = useState(() => createProfileForm(null))
  const [passwordForm, setPasswordForm] = useState(() => createPasswordForm())
  const [feedback, setFeedback] = useState({ type: '', text: '' })
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [postForm, setPostForm] = useState({ caption: '' })
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [isUpdatingPost, setIsUpdatingPost] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState('')
  const [adminFeedback, setAdminFeedback] = useState({ type: '', text: '' })
  const [isSavingAdminStudent, setIsSavingAdminStudent] = useState(false)
  const [isSavingSiteContent, setIsSavingSiteContent] = useState(false)
  const [deletingStudentId, setDeletingStudentId] = useState('')
  const [uploadingContentTarget, setUploadingContentTarget] = useState('')

  const siteContent = normalizeSiteContent(siteContentSource, defaultHomePageContent)
  const heroSlides = siteContent.heroSlides.length ? siteContent.heroSlides : defaultHomePageContent.heroSlides
  const eventRows = siteContent.eventRows.length ? siteContent.eventRows : defaultHomePageContent.eventRows
  const directoryStudents = students.length ? students : placeholderStudents.map(normalizeStudent)
  const highlightStudents = buildStudentGalleryHighlights(directoryStudents)
  const isAdmin = currentUser?.role === 'admin'
  const navLinks = navigationLinks

  useEffect(() => {
    if (heroSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length)
    }, 4200)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [heroSlides.length])

  useEffect(() => {
    setActiveSlide((currentSlide) => Math.min(currentSlide, Math.max(heroSlides.length - 1, 0)))
  }, [heroSlides.length])

  useEffect(() => {
    const handleResize = () => {
      setStudentsPerPage(getStudentsPerPage(window.innerWidth))

      if (window.innerWidth > MOBILE_NAV_BREAKPOINT) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (authToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken)
      return
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [authToken])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    setIsMobileMenuOpen(false)

    const scrollTimer = window.setTimeout(() => {
      if (location.hash) {
        const targetElement = document.getElementById(location.hash.slice(1))

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)

    return () => {
      window.clearTimeout(scrollTimer)
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    let isCancelled = false

    const hydrate = async () => {
      setIsLoadingSession(true)

      try {
        const nextStudents = await fetchStudentsList()
        const nextSiteContent = await fetchSiteContent()

        if (!isCancelled) {
          setStudents(nextStudents)
          setSiteContentSource(nextSiteContent)
        }

        if (!authToken) {
          if (!isCancelled) {
            setCurrentUser(null)
            setAdminStudents([])
            setProfileForm(createProfileForm(null))
            setPasswordForm(createPasswordForm())
          }
          return
        }

        const payload = await apiRequest('/api/auth/me', { token: authToken })

        if (isCancelled) {
          return
        }

        const normalizedUser = normalizeAuthenticatedUser(payload.user)
        setCurrentUser(normalizedUser)
        setProfileForm(createProfileForm(normalizedUser))
        setPasswordForm(createPasswordForm())
        setPostForm({ caption: '' })

        if (normalizedUser.role === 'admin') {
          const nextAdminStudents = await fetchAdminStudents(authToken)

          if (!isCancelled) {
            setAdminStudents(nextAdminStudents)
          }
        } else {
          setAdminStudents([])
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        if (authToken) {
          setAuthToken('')
          setCurrentUser(null)
          setAdminStudents([])
          setProfileForm(createProfileForm(null))
          setPasswordForm(createPasswordForm())
          setFeedback({ type: 'error', text: error.message })
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSession(false)
        }
      }
    }

    hydrate()

    return () => {
      isCancelled = true
    }
  }, [authToken])

  const studentPages = []

  for (let index = 0; index < directoryStudents.length; index += studentsPerPage) {
    studentPages.push(directoryStudents.slice(index, index + studentsPerPage))
  }

  const currentStudentPage = Math.min(activeStudentPage, Math.max(studentPages.length - 1, 0))
  const headerName = currentUser?.fullName || uiText.header.guestStudent
  const headerAcademicYear = isAdmin ? uiText.header.adminAccess : currentUser?.academicYear || uiText.header.manageProfilePrompt

  const handleMobileNavClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleStudentsTouchStart = (event) => {
    studentSwipeStartX.current = event.changedTouches[0]?.clientX ?? 0
  }

  const handleStudentsTouchEnd = (event) => {
    const touchEndX = event.changedTouches[0]?.clientX ?? 0
    const swipeDistance = studentSwipeStartX.current - touchEndX

    if (Math.abs(swipeDistance) < 48) {
      return
    }

    if (swipeDistance > 0) {
      setActiveStudentPage((currentPage) => Math.min(currentPage + 1, studentPages.length - 1))
      return
    }

    setActiveStudentPage((currentPage) => Math.max(currentPage - 1, 0))
  }

  const handleAuthFieldChange = (field, value) => {
    setAuthForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handlePostFieldChange = (value) => {
    setPostForm({ caption: value })
  }

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setIsSubmittingAuth(true)
    setFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: authForm.email, password: authForm.password },
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      setAuthToken(payload.token)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      setAdminStudents(normalizedUser.role === 'admin' ? await fetchAdminStudents(payload.token) : [])
      setProfileForm(createProfileForm(normalizedUser))
      setPasswordForm(createPasswordForm())
      setAuthForm({
        email: payload.user.email,
        password: '',
      })
      setFeedback({
        type: 'success',
        text: uiText.messages.loggedIn,
      })
      navigate(normalizedUser.role === 'admin' ? '/admin' : '/profile')
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()

    if (!authToken) {
      setFeedback({ type: 'error', text: uiText.messages.loginToUpdateProfile })
      return
    }

    setIsSavingProfile(true)
    setFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest('/api/auth/me', {
        method: 'PUT',
        body: profileForm,
        token: authToken,
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      if (normalizedUser.role === 'admin') {
        setAdminStudents(await fetchAdminStudents(authToken))
      }
      setProfileForm(createProfileForm(normalizedUser))
      setFeedback({ type: 'success', text: uiText.messages.profileUpdated })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!authToken) {
      setFeedback({ type: 'error', text: uiText.messages.loginBeforeAvatar })
      event.target.value = ''
      return
    }

    setIsUploadingAvatar(true)
    setFeedback({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const payload = await apiRequest('/api/auth/avatar', {
        method: 'POST',
        body: formData,
        token: authToken,
        isFormData: true,
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      if (normalizedUser.role === 'admin') {
        setAdminStudents(await fetchAdminStudents(authToken))
      }
      setProfileForm(createProfileForm(normalizedUser))
      setFeedback({ type: 'success', text: uiText.messages.profilePhotoUpdated })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      event.target.value = ''
      setIsUploadingAvatar(false)
    }
  }

  const handleLogout = () => {
    setAuthToken('')
    setCurrentUser(null)
    setAdminStudents([])
    setProfileForm(createProfileForm(null))
    setPasswordForm(createPasswordForm())
    setAuthForm({
      email: '',
      password: '',
    })
    setPostForm({ caption: '' })
    setFeedback({ type: 'success', text: uiText.messages.loggedOut })
    setAdminFeedback({ type: '', text: '' })
  }

  const handlePostSubmit = async (event) => {
    event.preventDefault()

    const mediaFiles = Array.from(event.target.elements.namedItem('postMedia')?.files || [])
    const imageFiles = mediaFiles.filter((file) => file.type.startsWith('image/'))
    const videoFiles = mediaFiles.filter((file) => file.type.startsWith('video/'))

    if (!authToken) {
      setFeedback({ type: 'error', text: uiText.messages.loginBeforeCreatePost })
      return
    }

    if (!mediaFiles.length) {
      setFeedback({ type: 'error', text: uiText.messages.chooseAtLeastOnePicture })
      return
    }

    if (imageFiles.length && videoFiles.length) {
      setFeedback({ type: 'error', text: uiText.messages.choosePicturesOrVideo })
      return
    }

    if (videoFiles.length > 1) {
      setFeedback({ type: 'error', text: uiText.messages.oneVideoOnly })
      return
    }

    if (imageFiles.length > 5) {
      setFeedback({ type: 'error', text: uiText.messages.maxFivePictures })
      return
    }

    if (videoFiles.length === 1) {
      try {
        const durationSeconds = await readVideoDuration(videoFiles[0])

        if (durationSeconds > 10) {
          setFeedback({ type: 'error', text: uiText.messages.videoTooLong })
          return
        }
      } catch (error) {
        setFeedback({ type: 'error', text: error.message })
        return
      }
    }

    if (!postForm.caption.trim()) {
      setFeedback({ type: 'error', text: uiText.messages.addCaption })
      return
    }

    setIsCreatingPost(true)
    setFeedback({ type: '', text: '' })

    try {
      const formData = new FormData()
      mediaFiles.forEach((mediaFile) => {
        formData.append('media', mediaFile)
      })
      formData.append('caption', postForm.caption.trim())

      const payload = await apiRequest('/api/auth/posts', {
        method: 'POST',
        body: formData,
        token: authToken,
        isFormData: true,
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      if (normalizedUser.role === 'admin') {
        setAdminStudents(await fetchAdminStudents(authToken))
      }
      setPostForm({ caption: '' })
      event.target.reset()
      setFeedback({ type: 'success', text: uiText.messages.postPublished })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handlePostUpdate = async (postId, caption, mediaUrls) => {
    if (!authToken) {
      setFeedback({ type: 'error', text: uiText.messages.loginBeforeEditPost })
      return false
    }

    const nextCaption = String(caption || '').trim()

    if (!nextCaption) {
      setFeedback({ type: 'error', text: uiText.messages.addCaption })
      return false
    }

    setIsUpdatingPost(true)
    setFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest(`/api/auth/posts/${postId}`, {
        method: 'PUT',
        body: { caption: nextCaption, mediaUrls },
        token: authToken,
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      if (normalizedUser.role === 'admin') {
        setAdminStudents(await fetchAdminStudents(authToken))
      }
      setFeedback({ type: 'success', text: uiText.messages.postUpdated })
      return true
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
      return false
    } finally {
      setIsUpdatingPost(false)
    }
  }

  const handlePostDelete = async (postId) => {
    if (!authToken) {
      setFeedback({ type: 'error', text: uiText.messages.loginBeforeDeletePost })
      return false
    }

    setDeletingPostId(postId)
    setFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest(`/api/auth/posts/${postId}`, {
        method: 'DELETE',
        token: authToken,
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      if (normalizedUser.role === 'admin') {
        setAdminStudents(await fetchAdminStudents(authToken))
      }
      setFeedback({ type: 'success', text: uiText.messages.postDeleted })
      return true
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
      return false
    } finally {
      setDeletingPostId('')
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()

    if (!authToken) {
      setFeedback({ type: 'error', text: uiText.messages.loginToChangePassword })
      return
    }

    setIsChangingPassword(true)
    setFeedback({ type: '', text: '' })

    try {
      await apiRequest('/api/auth/password', {
        method: 'PUT',
        body: passwordForm,
        token: authToken,
      })

      setPasswordForm(createPasswordForm())
      setFeedback({ type: 'success', text: uiText.messages.passwordUpdated })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const renderNavigationLink = (link, className, onClick) => {
    if (link.to === '/profile' || link.to === '/admin') {
      return (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? `${className} is-current` : className)}
          onClick={onClick}
        >
          {link.label}
        </NavLink>
      )
    }

    return (
      <Link key={link.to} to={link.to} className={className} onClick={onClick}>
        {link.label}
      </Link>
    )
  }

  const handleAdminStudentCreate = async (studentForm) => {
    if (!authToken) {
      return
    }

    setIsSavingAdminStudent(true)
    setAdminFeedback({ type: '', text: '' })

    try {
      await apiRequest('/api/admin/students', {
        method: 'POST',
        body: studentForm,
        token: authToken,
      })

      const [nextStudents, nextAdminStudents] = await Promise.all([
        fetchStudentsList(),
        fetchAdminStudents(authToken),
      ])

      setStudents(nextStudents)
      setAdminStudents(nextAdminStudents)
      setAdminFeedback({ type: 'success', text: uiText.messages.studentCreated })
    } catch (error) {
      setAdminFeedback({ type: 'error', text: error.message })
    } finally {
      setIsSavingAdminStudent(false)
    }
  }

  const handleAdminStudentUpdate = async (studentId, studentForm) => {
    if (!authToken) {
      return
    }

    setIsSavingAdminStudent(true)
    setAdminFeedback({ type: '', text: '' })

    try {
      await apiRequest(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        body: studentForm,
        token: authToken,
      })

      const [nextStudents, nextAdminStudents] = await Promise.all([
        fetchStudentsList(),
        fetchAdminStudents(authToken),
      ])

      setStudents(nextStudents)
      setAdminStudents(nextAdminStudents)
      setAdminFeedback({ type: 'success', text: uiText.messages.studentUpdated })
    } catch (error) {
      setAdminFeedback({ type: 'error', text: error.message })
    } finally {
      setIsSavingAdminStudent(false)
    }
  }

  const handleAdminStudentDelete = async (studentId) => {
    if (!authToken) {
      return
    }

    setDeletingStudentId(studentId)
    setAdminFeedback({ type: '', text: '' })

    try {
      await apiRequest(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        token: authToken,
      })

      const [nextStudents, nextAdminStudents] = await Promise.all([
        fetchStudentsList(),
        fetchAdminStudents(authToken),
      ])

      setStudents(nextStudents)
      setAdminStudents(nextAdminStudents)
      setAdminFeedback({ type: 'success', text: uiText.messages.studentDeleted })
    } catch (error) {
      setAdminFeedback({ type: 'error', text: error.message })
    } finally {
      setDeletingStudentId('')
    }
  }

  const handleSiteContentSave = async (content) => {
    if (!authToken) {
      return
    }

    setIsSavingSiteContent(true)
    setAdminFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest('/api/admin/homepage', {
        method: 'PUT',
        body: { content },
        token: authToken,
      })

      setSiteContentSource(payload.content)
      setAdminFeedback({ type: 'success', text: uiText.messages.homepageContentUpdated })
    } catch (error) {
      setAdminFeedback({ type: 'error', text: error.message })
    } finally {
      setIsSavingSiteContent(false)
    }
  }

  const handleSiteImageUpload = async (section, itemId, file) => {
    if (!authToken || !file) {
      return
    }

    const sectionKey = section === 'hero-slides' ? 'heroSlides' : 'eventRows'
    setUploadingContentTarget(`${sectionKey}:${itemId}`)
    setAdminFeedback({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('image', file)

      const payload = await apiRequest(`/api/admin/homepage/${section}/${itemId}/image`, {
        method: 'POST',
        body: formData,
        token: authToken,
        isFormData: true,
      })

      setSiteContentSource(payload.content)
      setAdminFeedback({ type: 'success', text: uiText.messages.homepageImageUpdated })
    } catch (error) {
      setAdminFeedback({ type: 'error', text: error.message })
    } finally {
      setUploadingContentTarget('')
    }
  }

  return (
    <div className="figma-page" data-language={language}>
      <header className="site-header" data-reveal>
        <Link className="brand-mark" to="/#photos">
          <span className="brand-mark-primary">DEF</span>
          <span className="brand-mark-secondary">{uiText.brandSecondary}</span>
        </Link>

        <nav className="site-nav" aria-label={uiText.header.primaryNavigation}>
          {navLinks.map((link) => renderNavigationLink(link, 'site-nav-link'))}
        </nav>

        <div className="header-actions">
          <div className="language-switch language-switch-desktop" role="group" aria-label={uiText.common.languageAriaLabel}>
            {supportedLanguages.map((option) => (
              <button
                key={option.code}
                type="button"
                className={language === option.code ? 'language-option is-active' : 'language-option'}
                onClick={() => setLanguage(option.code)}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>

          <Link className="profile-summary-link" to="/profile">
            <div className="profile-summary">
              <div>
                <strong>{headerName}</strong>
                <span>{headerAcademicYear}</span>
              </div>
              <div className="profile-avatar" aria-hidden="true">
                {currentUser?.avatarUrl ? (
                  <img className="avatar-image" src={getAssetUrl(currentUser.avatarUrl)} alt={`${currentUser.fullName} profile`} />
                ) : (
                  <>
                    <span className="profile-avatar-head" />
                    <span className="profile-avatar-body" />
                  </>
                )}
              </div>
            </div>
          </Link>

          <button
            type="button"
            className={isMobileMenuOpen ? 'menu-toggle is-open' : 'menu-toggle'}
            aria-label={uiText.header.toggleNavigation}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((currentState) => !currentState)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={isMobileMenuOpen ? 'mobile-nav-backdrop is-visible' : 'mobile-nav-backdrop'}
        onClick={handleMobileNavClose}
        aria-hidden="true"
      />

      <aside
        id="mobile-navigation"
        className={isMobileMenuOpen ? 'mobile-sidebar is-open' : 'mobile-sidebar'}
        aria-label={uiText.header.mobileNavigation}
      >
        <div className="mobile-sidebar-header">
          <strong>{uiText.header.menu}</strong>
          <button type="button" className="mobile-close" aria-label={uiText.header.closeNavigation} onClick={handleMobileNavClose}>
            x
          </button>
        </div>

        <nav className="mobile-nav-links">
          {navLinks.map((link) => renderNavigationLink(link, 'mobile-nav-link', handleMobileNavClose))}
        </nav>

        <div className="language-switch language-switch-sidebar" role="group" aria-label={uiText.common.languageAriaLabel}>
          {supportedLanguages.map((option) => (
            <button
              key={`sidebar-${option.code}`}
              type="button"
              className={language === option.code ? 'language-option is-active' : 'language-option'}
              onClick={() => setLanguage(option.code)}
            >
              {option.shortLabel}
            </button>
          ))}
        </div>
      </aside>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              heroSlides={heroSlides}
              activeSlide={activeSlide}
              onSlideChange={setActiveSlide}
              highlightStudents={highlightStudents}
              studentPages={studentPages}
              currentStudentPage={currentStudentPage}
              onStudentsTouchStart={handleStudentsTouchStart}
              onStudentsTouchEnd={handleStudentsTouchEnd}
              onStudentPageChange={setActiveStudentPage}
              eventRows={eventRows}
              text={uiText.home}
              carouselText={uiText.carousel}
              dateLocale={dateLocale}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <ProfilePage
              currentUser={currentUser}
              authForm={authForm}
              onAuthFieldChange={handleAuthFieldChange}
              onAuthSubmit={handleAuthSubmit}
              isSubmittingAuth={isSubmittingAuth}
              profileForm={profileForm}
              onProfileFieldChange={handleProfileFieldChange}
              onProfileSave={handleProfileSave}
              isSavingProfile={isSavingProfile}
              passwordForm={passwordForm}
              onPasswordFieldChange={handlePasswordFieldChange}
              onPasswordChange={handlePasswordChange}
              isChangingPassword={isChangingPassword}
              onAvatarChange={handleAvatarChange}
              isUploadingAvatar={isUploadingAvatar}
              postForm={postForm}
              onPostFieldChange={handlePostFieldChange}
              onPostSubmit={handlePostSubmit}
              isCreatingPost={isCreatingPost}
              onUpdatePost={handlePostUpdate}
              isUpdatingPost={isUpdatingPost}
              onDeletePost={handlePostDelete}
              deletingPostId={deletingPostId}
              onLogout={handleLogout}
              isLoadingSession={isLoadingSession}
              feedback={feedback}
              text={uiText.profile}
              carouselText={uiText.carousel}
              dateLocale={dateLocale}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPage
              currentUser={currentUser}
              isLoadingSession={isLoadingSession}
              students={adminStudents}
              siteContent={siteContent}
              feedback={adminFeedback}
              isSavingStudent={isSavingAdminStudent}
              isSavingSiteContent={isSavingSiteContent}
              deletingStudentId={deletingStudentId}
              uploadingContentTarget={uploadingContentTarget}
              onCreateStudent={handleAdminStudentCreate}
              onUpdateStudent={handleAdminStudentUpdate}
              onDeleteStudent={handleAdminStudentDelete}
              onSaveSiteContent={handleSiteContentSave}
              onUploadSiteImage={handleSiteImageUpload}
              text={uiText.admin}
              commonText={uiText.common}
            />
          }
        />
        <Route path="/students/:studentId" element={<StudentProfilePage currentUser={currentUser} text={uiText.studentProfile} carouselText={uiText.carousel} dateLocale={dateLocale} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="site-footer" data-reveal style={{ '--reveal-delay': '260ms' }}>
        <div>
          <strong>{siteContent.footer.title}</strong>
          <p>{siteContent.footer.description}</p>
        </div>
      </footer>
    </div>
  )
}

export default App
