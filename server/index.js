import cors from 'cors'
import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const storageRoot = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : __dirname
const bundledDataDirectory = path.join(__dirname, 'data')
const bundledUploadsDirectory = path.join(__dirname, 'uploads')
const dataDirectory = path.join(storageRoot, 'data')
const uploadsDirectory = path.join(storageRoot, 'uploads')
const dbPath = path.join(dataDirectory, 'db.json')
const JWT_SECRET = process.env.JWT_SECRET || 'def-dev-secret'
const PORT = Number(process.env.PORT || 4000)
const MAX_POST_IMAGES = 5
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const defaultHomepageContent = {
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

const app = express()

const storage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    await fs.mkdir(uploadsDirectory, { recursive: true })
    callback(null, uploadsDirectory)
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.png'
    callback(null, `${Date.now()}-${randomUUID()}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_POST_IMAGES },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image uploads are allowed.'))
      return
    }

    callback(null, true)
  },
})

app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('This origin is not allowed to access the API.'))
  },
}))
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(uploadsDirectory))

function cloneDefaultHomepageContent() {
  return JSON.parse(JSON.stringify(defaultHomepageContent))
}

function normalizePost(post) {
  const createdAt = post?.createdAt || new Date().toISOString()
  const imageUrls = Array.isArray(post?.imageUrls)
    ? post.imageUrls.map((imageUrl) => String(imageUrl || '').trim()).filter(Boolean).slice(0, MAX_POST_IMAGES)
    : String(post?.imageUrl || '').trim()
      ? [String(post.imageUrl).trim()]
      : []

  return {
    id: String(post?.id || randomUUID()),
    imageUrl: imageUrls[0] || '',
    imageUrls,
    caption: String(post?.caption || '').trim(),
    createdAt,
  }
}

function normalizeHomepageContent(homepage) {
  const fallback = cloneDefaultHomepageContent()
  const heroSlides = Array.isArray(homepage?.heroSlides) && homepage.heroSlides.length
    ? homepage.heroSlides
    : fallback.heroSlides
  const eventRows = Array.isArray(homepage?.eventRows) && homepage.eventRows.length
    ? homepage.eventRows
    : fallback.eventRows

  return {
    heroSlides: heroSlides.map((slide, index) => ({
      id: String(slide?.id || fallback.heroSlides[index]?.id || randomUUID()),
      title: String(slide?.title || fallback.heroSlides[index]?.title || '').trim() || fallback.heroSlides[index]?.title || 'Homepage slide',
      subtitle: String(slide?.subtitle || fallback.heroSlides[index]?.subtitle || '').trim() || fallback.heroSlides[index]?.subtitle || '',
      caption: String(slide?.caption || fallback.heroSlides[index]?.caption || '').trim() || fallback.heroSlides[index]?.caption || `Slide ${index + 1}`,
      imageUrl: String(slide?.imageUrl || fallback.heroSlides[index]?.imageUrl || ''),
    })),
    eventRows: eventRows.map((eventRow, index) => ({
      id: String(eventRow?.id || fallback.eventRows[index]?.id || randomUUID()),
      description: String(eventRow?.description || fallback.eventRows[index]?.description || '').trim()
        || fallback.eventRows[index]?.description
        || `Homepage event ${index + 1}`,
      imageUrl: String(eventRow?.imageUrl || fallback.eventRows[index]?.imageUrl || ''),
    })),
    footer: {
      title: String(homepage?.footer?.title || fallback.footer.title).trim() || fallback.footer.title,
      description: String(homepage?.footer?.description || fallback.footer.description).trim() || fallback.footer.description,
    },
  }
}

function normalizeDb(parsed) {
  const usersSource = Array.isArray(parsed?.users) ? parsed.users : []
  const users = usersSource.map((user) => {
    const createdAt = user?.createdAt || new Date().toISOString()

    return {
      id: String(user?.id || randomUUID()),
      email: String(user?.email || '').trim().toLowerCase(),
      passwordHash: String(user?.passwordHash || ''),
      fullName: String(user?.fullName || 'Student').trim() || 'Student',
      academicYear: String(user?.academicYear || '2025-2026').trim() || '2025-2026',
      major1: String(user?.major1 || 'Add major').trim() || 'Add major',
      major2: String(user?.major2 || 'Add second major').trim() || 'Add second major',
      bio: String(user?.bio || 'Tell the Department of French community about yourself.').trim()
        || 'Tell the Department of French community about yourself.',
      location: String(user?.location || '').trim(),
      avatarUrl: String(user?.avatarUrl || ''),
      role: user?.role === 'admin' ? 'admin' : 'student',
      createdAt,
      updatedAt: user?.updatedAt || createdAt,
      posts: Array.isArray(user?.posts) ? user.posts.map(normalizePost) : [],
    }
  })

  if (users.length && !users.some((user) => user.role === 'admin')) {
    users[0] = {
      ...users[0],
      role: 'admin',
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    users,
    homepage: normalizeHomepageContent(parsed?.homepage),
  }
}

function resolveUploadPath(assetUrl) {
  return path.join(uploadsDirectory, path.basename(assetUrl))
}

async function deleteUpload(assetUrl) {
  if (!assetUrl || !assetUrl.startsWith('/uploads/')) {
    return
  }

  try {
    await fs.unlink(resolveUploadPath(assetUrl))
  } catch {
    // Ignore stale file cleanup failures.
  }
}

async function deleteUploads(assetUrls) {
  await Promise.all((assetUrls || []).map((assetUrl) => deleteUpload(assetUrl)))
}

function getPostAssetUrls(post) {
  if (Array.isArray(post?.imageUrls) && post.imageUrls.length) {
    return post.imageUrls
  }

  return post?.imageUrl ? [post.imageUrl] : []
}

async function ensureDb() {
  await fs.mkdir(dataDirectory, { recursive: true })
  await fs.mkdir(uploadsDirectory, { recursive: true })

  try {
    await fs.access(dbPath)
  } catch {
    const bundledDbPath = path.join(bundledDataDirectory, 'db.json')

    try {
      const bundledDb = await fs.readFile(bundledDbPath, 'utf8')
      await fs.writeFile(dbPath, bundledDb)
    } catch {
      await fs.writeFile(dbPath, JSON.stringify({ users: [], homepage: cloneDefaultHomepageContent() }, null, 2))
    }
  }

  if (storageRoot !== __dirname) {
    try {
      const bundledUploads = await fs.readdir(bundledUploadsDirectory)

      await Promise.all(bundledUploads.map(async (fileName) => {
        const sourcePath = path.join(bundledUploadsDirectory, fileName)
        const targetPath = path.join(uploadsDirectory, fileName)

        try {
          await fs.access(targetPath)
        } catch {
          await fs.copyFile(sourcePath, targetPath)
        }
      }))
    } catch {
      // Ignore missing bundled uploads when running from a clean environment.
    }
  }
}

async function readDb() {
  await ensureDb()
  const raw = await fs.readFile(dbPath, 'utf8')
  const parsed = JSON.parse(raw)
  const normalized = normalizeDb(parsed)

  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    await writeDb(normalized)
  }

  return normalized
}

async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2))
}

function toPublicPost(post) {
  return {
    id: post.id,
    imageUrl: post.imageUrl,
    imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []),
    caption: post.caption,
    createdAt: post.createdAt,
  }
}

function toPublicUser(user, options = {}) {
  const { includePosts = false, includeEmail = false, includeRole = false } = options

  return {
    id: user.id,
    email: includeEmail ? user.email : undefined,
    fullName: user.fullName,
    academicYear: user.academicYear,
    major1: user.major1,
    major2: user.major2,
    bio: user.bio,
    location: user.location,
    avatarUrl: user.avatarUrl,
    role: includeRole ? user.role : undefined,
    posts: includePosts ? (user.posts || []).map(toPublicPost) : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

async function getUserById(userId) {
  const db = await readDb()
  return db.users.find((user) => user.id === userId) || null
}

async function requireAuth(request, response, next) {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Authentication required.' })
    return
  }

  try {
    const token = authorization.slice('Bearer '.length)
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await getUserById(payload.sub)

    if (!user) {
      response.status(401).json({ message: 'Account no longer exists.' })
      return
    }

    request.user = user
    next()
  } catch {
    response.status(401).json({ message: 'Invalid or expired token.' })
  }
}

function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    response.status(403).json({ message: 'Admin access is required.' })
    return
  }

  next()
}

function sanitizeAdminStudentPayload(body, options = {}) {
  const { includePassword = false } = options
  const payload = {
    fullName: String(body?.fullName || '').trim(),
    email: String(body?.email || '').trim().toLowerCase(),
    academicYear: String(body?.academicYear || '').trim() || '2025-2026',
    major1: String(body?.major1 || '').trim() || 'Add major',
    major2: String(body?.major2 || '').trim() || 'Add second major',
    bio: String(body?.bio || '').trim() || 'Tell the Department of French community about yourself.',
    location: String(body?.location || '').trim(),
    role: body?.role === 'admin' ? 'admin' : 'student',
  }

  if (includePassword) {
    payload.password = String(body?.password || '')
  }

  return payload
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/site-content', async (_request, response) => {
  const db = await readDb()
  response.json({ content: db.homepage })
})

app.get('/api/students', async (_request, response) => {
  const db = await readDb()
  response.json({ students: db.users.map((user) => toPublicUser(user, { includePosts: true })) })
})

app.get('/api/students/:id', async (request, response) => {
  const db = await readDb()
  const student = db.users.find((user) => user.id === request.params.id)

  if (!student) {
    response.status(404).json({ message: 'Student not found.' })
    return
  }

  response.json({ student: toPublicUser(student, { includePosts: true }) })
})

app.post('/api/auth/login', async (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase()
  const password = String(request.body.password || '')

  if (!email || !password) {
    response.status(400).json({ message: 'Email and password are required.' })
    return
  }

  const db = await readDb()
  const user = db.users.find((candidate) => candidate.email === email)

  if (!user) {
    response.status(401).json({ message: 'Invalid email or password.' })
    return
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    response.status(401).json({ message: 'Invalid email or password.' })
    return
  }

  response.json({ token: signToken(user), user: toPublicUser(user, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.get('/api/auth/me', requireAuth, async (request, response) => {
  response.json({ user: toPublicUser(request.user, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.put('/api/auth/me', requireAuth, async (request, response) => {
  const updates = {
    fullName: String(request.body.fullName || '').trim(),
    academicYear: String(request.body.academicYear || '').trim(),
    major1: String(request.body.major1 || '').trim(),
    major2: String(request.body.major2 || '').trim(),
    bio: String(request.body.bio || '').trim(),
    location: String(request.body.location || '').trim(),
  }

  if (!updates.fullName) {
    response.status(400).json({ message: 'Full name is required.' })
    return
  }

  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.user.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'User not found.' })
    return
  }

  const nextUser = {
    ...db.users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  db.users[userIndex] = nextUser
  await writeDb(db)

  response.json({ user: toPublicUser(nextUser, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.put('/api/auth/password', requireAuth, async (request, response) => {
  const currentPassword = String(request.body.currentPassword || '')
  const nextPassword = String(request.body.nextPassword || '')
  const confirmPassword = String(request.body.confirmPassword || '')

  if (!currentPassword || !nextPassword || !confirmPassword) {
    response.status(400).json({ message: 'Current password, new password, and confirmation are required.' })
    return
  }

  if (nextPassword.length < 6) {
    response.status(400).json({ message: 'New password must be at least 6 characters.' })
    return
  }

  if (nextPassword !== confirmPassword) {
    response.status(400).json({ message: 'New password and confirmation must match.' })
    return
  }

  const currentPasswordMatches = await bcrypt.compare(currentPassword, request.user.passwordHash)

  if (!currentPasswordMatches) {
    response.status(401).json({ message: 'Current password is incorrect.' })
    return
  }

  const nextPasswordMatchesCurrent = await bcrypt.compare(nextPassword, request.user.passwordHash)

  if (nextPasswordMatchesCurrent) {
    response.status(400).json({ message: 'Choose a different password from your current one.' })
    return
  }

  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.user.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'User not found.' })
    return
  }

  const nextUser = {
    ...db.users[userIndex],
    passwordHash: await bcrypt.hash(nextPassword, 10),
    updatedAt: new Date().toISOString(),
  }

  db.users[userIndex] = nextUser
  await writeDb(db)

  response.json({ message: 'Password updated successfully.' })
})

app.post('/api/auth/avatar', requireAuth, upload.single('avatar'), async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: 'An image file is required.' })
    return
  }

  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.user.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'User not found.' })
    return
  }

  const currentUser = db.users[userIndex]

  await deleteUpload(currentUser.avatarUrl)

  const nextUser = {
    ...currentUser,
    avatarUrl: `/uploads/${request.file.filename}`,
    updatedAt: new Date().toISOString(),
  }

  db.users[userIndex] = nextUser
  await writeDb(db)

  response.json({ user: toPublicUser(nextUser, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.post('/api/auth/posts', requireAuth, upload.array('images', MAX_POST_IMAGES), async (request, response) => {
  const uploadedFiles = Array.isArray(request.files) ? request.files : []

  if (!uploadedFiles.length) {
    response.status(400).json({ message: 'At least one post image is required.' })
    return
  }

  const caption = String(request.body.caption || '').trim()

  if (!caption) {
    await deleteUploads(uploadedFiles.map((file) => `/uploads/${file.filename}`))
    response.status(400).json({ message: 'A post caption is required.' })
    return
  }

  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.user.id)

  if (userIndex === -1) {
    await deleteUploads(uploadedFiles.map((file) => `/uploads/${file.filename}`))
    response.status(404).json({ message: 'User not found.' })
    return
  }

  const imageUrls = uploadedFiles.map((file) => `/uploads/${file.filename}`)

  const nextPost = {
    id: randomUUID(),
    imageUrl: imageUrls[0],
    imageUrls,
    caption,
    createdAt: new Date().toISOString(),
  }

  const nextUser = {
    ...db.users[userIndex],
    posts: [nextPost, ...(db.users[userIndex].posts || [])],
    updatedAt: new Date().toISOString(),
  }

  db.users[userIndex] = nextUser
  await writeDb(db)

  response.status(201).json({ user: toPublicUser(nextUser, { includePosts: true, includeEmail: true, includeRole: true }), post: toPublicPost(nextPost) })
})

app.put('/api/auth/posts/:postId', requireAuth, async (request, response) => {
  const caption = String(request.body.caption || '').trim()

  if (!caption) {
    response.status(400).json({ message: 'A post caption is required.' })
    return
  }

  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.user.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'User not found.' })
    return
  }

  const postIndex = (db.users[userIndex].posts || []).findIndex((post) => post.id === request.params.postId)

  if (postIndex === -1) {
    response.status(404).json({ message: 'Post not found.' })
    return
  }

  const currentPost = db.users[userIndex].posts[postIndex]
  const currentImageUrls = getPostAssetUrls(currentPost)
  const requestedImageUrls = Array.isArray(request.body.imageUrls)
    ? request.body.imageUrls.map((imageUrl) => String(imageUrl || '').trim()).filter(Boolean)
    : currentImageUrls

  if (!requestedImageUrls.length) {
    response.status(400).json({ message: 'A post must keep at least one image.' })
    return
  }

  if (requestedImageUrls.length > MAX_POST_IMAGES) {
    response.status(400).json({ message: `A post can contain at most ${MAX_POST_IMAGES} images.` })
    return
  }

  const invalidImageUrl = requestedImageUrls.find((imageUrl) => !currentImageUrls.includes(imageUrl))

  if (invalidImageUrl) {
    response.status(400).json({ message: 'Post images could not be updated.' })
    return
  }

  const removedImageUrls = currentImageUrls.filter((imageUrl) => !requestedImageUrls.includes(imageUrl))

  const nextPosts = [...db.users[userIndex].posts]
  nextPosts[postIndex] = {
    ...currentPost,
    imageUrl: requestedImageUrls[0],
    imageUrls: requestedImageUrls,
    caption,
  }

  await deleteUploads(removedImageUrls)

  const nextUser = {
    ...db.users[userIndex],
    posts: nextPosts,
    updatedAt: new Date().toISOString(),
  }

  db.users[userIndex] = nextUser
  await writeDb(db)

  response.json({
    user: toPublicUser(nextUser, { includePosts: true, includeEmail: true, includeRole: true }),
    post: toPublicPost(nextPosts[postIndex]),
  })
})

app.delete('/api/auth/posts/:postId', requireAuth, async (request, response) => {
  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.user.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'User not found.' })
    return
  }

  const currentPosts = [...(db.users[userIndex].posts || [])]
  const postIndex = currentPosts.findIndex((post) => post.id === request.params.postId)

  if (postIndex === -1) {
    response.status(404).json({ message: 'Post not found.' })
    return
  }

  const [removedPost] = currentPosts.splice(postIndex, 1)
  await deleteUploads(getPostAssetUrls(removedPost))

  const nextUser = {
    ...db.users[userIndex],
    posts: currentPosts,
    updatedAt: new Date().toISOString(),
  }

  db.users[userIndex] = nextUser
  await writeDb(db)

  response.json({ user: toPublicUser(nextUser, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.get('/api/admin/students', requireAuth, requireAdmin, async (_request, response) => {
  const db = await readDb()
  response.json({ students: db.users.map((user) => toPublicUser(user, { includePosts: true, includeEmail: true, includeRole: true })) })
})

app.post('/api/admin/students', requireAuth, requireAdmin, async (request, response) => {
  const payload = sanitizeAdminStudentPayload(request.body, { includePassword: true })

  if (!payload.fullName || !payload.email || !payload.password) {
    response.status(400).json({ message: 'Full name, email, and password are required.' })
    return
  }

  if (payload.password.length < 6) {
    response.status(400).json({ message: 'Password must be at least 6 characters.' })
    return
  }

  const db = await readDb()
  const existingUser = db.users.find((user) => user.email === payload.email)

  if (existingUser) {
    response.status(409).json({ message: 'An account with that email already exists.' })
    return
  }

  const timestamp = new Date().toISOString()
  const passwordHash = await bcrypt.hash(payload.password, 10)
  const student = {
    id: randomUUID(),
    email: payload.email,
    passwordHash,
    fullName: payload.fullName,
    academicYear: payload.academicYear,
    major1: payload.major1,
    major2: payload.major2,
    bio: payload.bio,
    location: payload.location,
    avatarUrl: '',
    role: payload.role,
    createdAt: timestamp,
    updatedAt: timestamp,
    posts: [],
  }

  db.users.unshift(student)
  await writeDb(db)

  response.status(201).json({ student: toPublicUser(student, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.put('/api/admin/students/:id', requireAuth, requireAdmin, async (request, response) => {
  const payload = sanitizeAdminStudentPayload(request.body, { includePassword: true })

  if (!payload.fullName || !payload.email) {
    response.status(400).json({ message: 'Full name and email are required.' })
    return
  }

  if (payload.password && payload.password.length < 6) {
    response.status(400).json({ message: 'Password must be at least 6 characters.' })
    return
  }

  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.params.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'Student not found.' })
    return
  }

  const currentStudent = db.users[userIndex]
  const emailInUse = db.users.some((user) => user.email === payload.email && user.id !== currentStudent.id)

  if (emailInUse) {
    response.status(409).json({ message: 'Another account already uses that email.' })
    return
  }

  if (currentStudent.role === 'admin' && payload.role !== 'admin') {
    const adminCount = db.users.filter((user) => user.role === 'admin').length

    if (adminCount === 1) {
      response.status(400).json({ message: 'At least one admin account must remain.' })
      return
    }
  }

  const nextStudent = {
    ...currentStudent,
    fullName: payload.fullName,
    email: payload.email,
    academicYear: payload.academicYear,
    major1: payload.major1,
    major2: payload.major2,
    bio: payload.bio,
    location: payload.location,
    role: payload.role,
    updatedAt: new Date().toISOString(),
  }

  if (payload.password) {
    nextStudent.passwordHash = await bcrypt.hash(payload.password, 10)
  }

  db.users[userIndex] = nextStudent
  await writeDb(db)

  response.json({ student: toPublicUser(nextStudent, { includePosts: true, includeEmail: true, includeRole: true }) })
})

app.delete('/api/admin/students/:id', requireAuth, requireAdmin, async (request, response) => {
  const db = await readDb()
  const userIndex = db.users.findIndex((user) => user.id === request.params.id)

  if (userIndex === -1) {
    response.status(404).json({ message: 'Student not found.' })
    return
  }

  const student = db.users[userIndex]

  if (student.id === request.user.id) {
    response.status(400).json({ message: 'You cannot delete the account you are currently using.' })
    return
  }

  if (student.role === 'admin') {
    const adminCount = db.users.filter((user) => user.role === 'admin').length

    if (adminCount === 1) {
      response.status(400).json({ message: 'At least one admin account must remain.' })
      return
    }
  }

  await deleteUpload(student.avatarUrl)
  await deleteUploads((student.posts || []).flatMap((post) => getPostAssetUrls(post)))

  db.users.splice(userIndex, 1)
  await writeDb(db)

  response.json({ message: 'Student deleted successfully.' })
})

app.put('/api/admin/homepage', requireAuth, requireAdmin, async (request, response) => {
  const nextContent = normalizeHomepageContent(request.body?.content)
  const db = await readDb()

  db.homepage = nextContent
  await writeDb(db)

  response.json({ content: db.homepage })
})

app.post('/api/admin/homepage/:section/:itemId/image', requireAuth, requireAdmin, upload.single('image'), async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: 'A homepage image is required.' })
    return
  }

  const sectionMap = {
    'hero-slides': 'heroSlides',
    'event-rows': 'eventRows',
  }
  const sectionName = sectionMap[request.params.section]

  if (!sectionName) {
    response.status(400).json({ message: 'Unknown homepage section.' })
    return
  }

  const db = await readDb()
  const itemIndex = db.homepage[sectionName].findIndex((item) => item.id === request.params.itemId)

  if (itemIndex === -1) {
    response.status(404).json({ message: 'Homepage item not found.' })
    return
  }

  const currentItem = db.homepage[sectionName][itemIndex]
  await deleteUpload(currentItem.imageUrl)

  db.homepage[sectionName][itemIndex] = {
    ...currentItem,
    imageUrl: `/uploads/${request.file.filename}`,
  }

  await writeDb(db)

  response.json({ content: db.homepage })
})

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_COUNT' || (error.code === 'LIMIT_UNEXPECTED_FILE' && error.field === 'images')) {
      response.status(400).json({ message: `You can upload up to ${MAX_POST_IMAGES} photos in one post.` })
      return
    }

    response.status(400).json({ message: error.message })
    return
  }

  if (error instanceof Error) {
    response.status(400).json({ message: error.message })
    return
  }

  response.status(500).json({ message: 'Unexpected server error.' })
})

await ensureDb()

app.listen(PORT, () => {
  console.log(`DEF server listening on port ${PORT}`)
  console.log(`Using storage directory: ${storageRoot}`)
})
