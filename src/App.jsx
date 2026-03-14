import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import useScrollReveal from './hooks/useScrollReveal'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import StudentProfilePage from './pages/StudentProfilePage'
import AdminPage from './pages/AdminPage'
import { apiRequest, getAssetUrl } from './utils/api'
import { getPostImageUrls, normalizePostMediaCollection } from './utils/postMedia'
import './styles/app.css'

const TOKEN_STORAGE_KEY = 'def-auth-token'
const MOBILE_NAV_BREAKPOINT = 900

const navigationLinks = [
  { label: 'Events', to: '/#events' },
  { label: 'Photos', to: '/#photos' },
  { label: 'Profile', to: '/profile' },
  { label: 'Students', to: '/#students' },
]

const defaultHomePageContent = {
  heroSlides: [
  {
    id: 'hero-community',
    title: 'DEF alumni memories in one place',
    subtitle: 'Students can log in, keep their profile current, and share a stronger public identity inside the Department of French portal.',
    caption: 'Student portal',
    imageUrl: '/uploads/slide1.jpg',
  },
  {
    id: 'hero-access',
    title: 'Student accounts managed by admins',
    subtitle: 'Profiles are no longer placeholders. Existing accounts can sign in, update details, and use avatar uploads backed by the server.',
    caption: 'Account access',
    imageUrl: '/uploads/slide2.jpg',
  },
  {
    id: 'hero-management',
    title: 'Manage photos and personal information',
    subtitle: 'The portal is ready for login, profile updates, and a student directory powered by stored backend data.',
    caption: 'Editable profile',
    imageUrl: '/uploads/1773222107424-f09db150-2cc1-426d-ad89-6ef01bea0992.jpg',
  },
  ],
  eventRows: [
    {
      id: 'event-profile',
      description: 'Authenticated users can edit their personal information, majors, location, and bio from the portal.',
      imageUrl: '/uploads/slide1.jpg',
    },
    {
      id: 'event-directory',
      description: 'Admin users can add, update, and remove student records without editing source files.',
      imageUrl: '/uploads/slide2.jpg',
    },
    {
      id: 'event-photos',
      description: 'Homepage pictures and section descriptions can be updated from the admin panel and reflected on the public site.',
      imageUrl: '/uploads/slide3.jpg',
    },
  ],
  footer: {
    title: 'DEF student portal backend',
    description: 'Authentication, editable profiles, and picture uploads are now part of the application architecture and ready for further expansion.',
  },
}

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
    major1: student.major1 || 'Add major',
    major2: student.major2 || 'Add second major',
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
        .filter((post) => getPostImageUrls(post).length)
        .sort((leftPost, rightPost) => new Date(rightPost.createdAt || 0) - new Date(leftPost.createdAt || 0))

      const latestPost = galleryPosts[0]

      if (!latestPost) {
        return null
      }

      const imageUrls = galleryPosts.flatMap((post) => getPostImageUrls(post))

      return {
        id: student.id,
        studentId: student.id,
        fullName: student.fullName,
        imageUrl: imageUrls[0],
        imageUrls,
        caption: latestPost.caption || '',
        createdAt: latestPost.createdAt || '',
        totalPhotos: student.posts.reduce((photoCount, post) => photoCount + getPostImageUrls(post).length, 0),
      }
    })
    .filter(Boolean)
    .sort((leftHighlight, rightHighlight) => new Date(rightHighlight.createdAt || 0) - new Date(leftHighlight.createdAt || 0))
    .slice(0, 9)
}

function normalizeSiteContent(content) {
  const fallback = defaultHomePageContent
  const heroSlides = Array.isArray(content?.heroSlides) && content.heroSlides.length ? content.heroSlides : fallback.heroSlides
  const eventRows = Array.isArray(content?.eventRows) && content.eventRows.length ? content.eventRows : fallback.eventRows

  return {
    heroSlides: heroSlides.map((slide, index) => ({
      id: slide.id || fallback.heroSlides[index]?.id || `hero-${index + 1}`,
      title: slide.title || fallback.heroSlides[index]?.title || '',
      subtitle: slide.subtitle || fallback.heroSlides[index]?.subtitle || '',
      caption: slide.caption || fallback.heroSlides[index]?.caption || `Slide ${index + 1}`,
      imageUrl: slide.imageUrl || fallback.heroSlides[index]?.imageUrl || '',
    })),
    eventRows: eventRows.map((eventRow, index) => ({
      id: eventRow.id || fallback.eventRows[index]?.id || `event-${index + 1}`,
      description: eventRow.description || fallback.eventRows[index]?.description || '',
      imageUrl: eventRow.imageUrl || fallback.eventRows[index]?.imageUrl || '',
    })),
    footer: {
      title: content?.footer?.title || fallback.footer.title,
      description: content?.footer?.description || fallback.footer.description,
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
  return normalizeSiteContent(payload.content)
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  useScrollReveal(`${location.pathname}${location.hash}`)

  const studentSwipeStartX = useRef(0)
  const [activeSlide, setActiveSlide] = useState(0)
  const [studentsPerPage, setStudentsPerPage] = useState(() => getStudentsPerPage(window.innerWidth))
  const [activeStudentPage, setActiveStudentPage] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [students, setStudents] = useState([])
  const [adminStudents, setAdminStudents] = useState([])
  const [siteContent, setSiteContent] = useState(() => normalizeSiteContent(defaultHomePageContent))
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
          setSiteContent(nextSiteContent)
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
  const headerName = currentUser?.fullName || 'Guest student'
  const headerAcademicYear = isAdmin ? 'Admin access' : currentUser?.academicYear || 'Log in to manage profile'

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
        text: 'Logged in successfully.',
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
      setFeedback({ type: 'error', text: 'Please log in to update your profile.' })
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
      setFeedback({ type: 'success', text: 'Profile updated successfully.' })
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
      setFeedback({ type: 'error', text: 'Please log in before uploading an avatar.' })
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
      setFeedback({ type: 'success', text: 'Profile photo updated successfully.' })
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
    setFeedback({ type: 'success', text: 'You have been logged out.' })
    setAdminFeedback({ type: '', text: '' })
  }

  const handlePostSubmit = async (event) => {
    event.preventDefault()

    const imageFiles = Array.from(event.target.elements.namedItem('postImages')?.files || [])

    if (!authToken) {
      setFeedback({ type: 'error', text: 'Please log in before creating a post.' })
      return
    }

    if (!imageFiles.length) {
      setFeedback({ type: 'error', text: 'Please choose at least one picture for the post.' })
      return
    }

    if (imageFiles.length > 5) {
      setFeedback({ type: 'error', text: 'You can upload up to 5 pictures in one post.' })
      return
    }

    if (!postForm.caption.trim()) {
      setFeedback({ type: 'error', text: 'Please add a caption for the post.' })
      return
    }

    setIsCreatingPost(true)
    setFeedback({ type: '', text: '' })

    try {
      const formData = new FormData()
      imageFiles.forEach((imageFile) => {
        formData.append('images', imageFile)
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
      setFeedback({ type: 'success', text: 'Post published successfully.' })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handlePostUpdate = async (postId, caption, imageUrls) => {
    if (!authToken) {
      setFeedback({ type: 'error', text: 'Please log in before editing a post.' })
      return false
    }

    const nextCaption = String(caption || '').trim()

    if (!nextCaption) {
      setFeedback({ type: 'error', text: 'Please add a caption for the post.' })
      return false
    }

    setIsUpdatingPost(true)
    setFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest(`/api/auth/posts/${postId}`, {
        method: 'PUT',
        body: { caption: nextCaption, imageUrls },
        token: authToken,
      })

      const nextStudents = await fetchStudentsList()
      setStudents(nextStudents)
      const normalizedUser = normalizeAuthenticatedUser(payload.user)
      setCurrentUser(normalizedUser)
      if (normalizedUser.role === 'admin') {
        setAdminStudents(await fetchAdminStudents(authToken))
      }
      setFeedback({ type: 'success', text: 'Post updated successfully.' })
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
      setFeedback({ type: 'error', text: 'Please log in before deleting a post.' })
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
      setFeedback({ type: 'success', text: 'Post deleted successfully.' })
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
      setFeedback({ type: 'error', text: 'Please log in to change your password.' })
      return
    }

    setIsChangingPassword(true)
    setFeedback({ type: '', text: '' })

    try {
      const payload = await apiRequest('/api/auth/password', {
        method: 'PUT',
        body: passwordForm,
        token: authToken,
      })

      setPasswordForm(createPasswordForm())
      setFeedback({ type: 'success', text: payload.message || 'Password updated successfully.' })
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
          key={link.label}
          to={link.to}
          className={({ isActive }) => (isActive ? `${className} is-current` : className)}
          onClick={onClick}
        >
          {link.label}
        </NavLink>
      )
    }

    return (
      <Link key={link.label} to={link.to} className={className} onClick={onClick}>
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
      setAdminFeedback({ type: 'success', text: 'Student account created successfully.' })
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
      setAdminFeedback({ type: 'success', text: 'Student account updated successfully.' })
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
      setAdminFeedback({ type: 'success', text: 'Student account deleted successfully.' })
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

      setSiteContent(normalizeSiteContent(payload.content))
      setAdminFeedback({ type: 'success', text: 'Homepage content updated successfully.' })
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

      setSiteContent(normalizeSiteContent(payload.content))
      setAdminFeedback({ type: 'success', text: 'Homepage image updated successfully.' })
    } catch (error) {
      setAdminFeedback({ type: 'error', text: error.message })
    } finally {
      setUploadingContentTarget('')
    }
  }

  return (
    <div className="figma-page">
      <header className="site-header" data-reveal>
        <Link className="brand-mark" to="/#photos">
          <span className="brand-mark-primary">DEF</span>
          <span className="brand-mark-secondary">Alumni</span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {navLinks.map((link) => renderNavigationLink(link, 'site-nav-link'))}
        </nav>

        <div className="header-actions">
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
            aria-label="Toggle navigation menu"
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
        aria-label="Mobile navigation"
      >
        <div className="mobile-sidebar-header">
          <strong>Menu</strong>
          <button type="button" className="mobile-close" aria-label="Close navigation menu" onClick={handleMobileNavClose}>
            x
          </button>
        </div>

        <nav className="mobile-nav-links">
          {navLinks.map((link) => renderNavigationLink(link, 'mobile-nav-link', handleMobileNavClose))}
        </nav>
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
            />
          }
        />
        <Route path="/students/:studentId" element={<StudentProfilePage currentUser={currentUser} />} />
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
