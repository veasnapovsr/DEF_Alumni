import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAssetUrl } from '../utils/api'

function createStudentDraft(student) {
  return {
    fullName: student?.fullName || '',
    email: student?.email || '',
    password: '',
    academicYear: student?.academicYear || '2025-2026',
    major1: student?.major1 || '',
    major2: student?.major2 || '',
    bio: student?.bio || '',
    location: student?.location || '',
    role: student?.role || 'student',
  }
}

function cloneSiteContent(siteContent) {
  return {
    heroSlides: siteContent.heroSlides.map((slide) => ({ ...slide })),
    eventRows: siteContent.eventRows.map((eventRow) => ({ ...eventRow })),
    footer: { ...siteContent.footer },
  }
}

function AdminPage({
  currentUser,
  isLoadingSession,
  students,
  siteContent,
  feedback,
  isSavingStudent,
  isSavingSiteContent,
  deletingStudentId,
  uploadingContentTarget,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSaveSiteContent,
  onUploadSiteImage,
}) {
  const [activePanel, setActivePanel] = useState('students')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentForm, setStudentForm] = useState(() => createStudentDraft(null))
  const [siteDraft, setSiteDraft] = useState(() => cloneSiteContent(siteContent))

  useEffect(() => {
    setSiteDraft(cloneSiteContent(siteContent))
  }, [siteContent])

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentForm(createStudentDraft(null))
      return
    }

    const selectedStudent = students.find((student) => student.id === selectedStudentId)
    setStudentForm(createStudentDraft(selectedStudent || null))
  }, [selectedStudentId, students])

  const handleStudentFieldChange = (field, value) => {
    setStudentForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleSiteFieldChange = (section, index, field, value) => {
    setSiteDraft((currentDraft) => ({
      ...currentDraft,
      [section]: currentDraft[section].map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )),
    }))
  }

  const handleFooterChange = (field, value) => {
    setSiteDraft((currentDraft) => ({
      ...currentDraft,
      footer: {
        ...currentDraft.footer,
        [field]: value,
      },
    }))
  }

  const handleStudentSubmit = async (event) => {
    event.preventDefault()

    if (selectedStudentId) {
      await onUpdateStudent(selectedStudentId, studentForm)
      return
    }

    await onCreateStudent(studentForm)
    setStudentForm(createStudentDraft(null))
  }

  const handleStudentDelete = async (student) => {
    const confirmed = window.confirm(`Delete ${student.fullName}? This will remove the student account and uploaded images.`)

    if (!confirmed) {
      return
    }

    await onDeleteStudent(student.id)

    if (selectedStudentId === student.id) {
      setSelectedStudentId('')
      setStudentForm(createStudentDraft(null))
    }
  }

  if (isLoadingSession) {
    return (
      <main className="page-layout admin-page-layout">
        <section className="admin-shell" data-reveal>
          <p className="loading-note">Loading admin session...</p>
        </section>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="page-layout admin-page-layout">
        <section className="admin-shell admin-empty-state" data-reveal>
          <p className="section-kicker">Admin panel</p>
          <h1>Login required</h1>
          <p>Sign in with an admin account to manage students and update the homepage content.</p>
          <Link className="primary-action profile-nav-action" to="/profile">
            Go to login
          </Link>
        </section>
      </main>
    )
  }

  if (currentUser.role !== 'admin') {
    return (
      <main className="page-layout admin-page-layout">
        <section className="admin-shell admin-empty-state" data-reveal>
          <p className="section-kicker">Admin panel</p>
          <h1>Access denied</h1>
          <p>This account can edit its own profile, but it does not have admin permission to manage students or homepage content.</p>
          <Link className="secondary-action profile-nav-action" to="/">
            Return to homepage
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-layout admin-page-layout">
      <section className="admin-shell" data-reveal style={{ '--reveal-delay': '60ms' }}>
        <aside className="admin-sidebar">
          <div className="admin-sidebar-copy">
            <p className="section-kicker">Admin panel</p>
            <h1>Manage students and homepage content</h1>
            <p>Create student accounts, update existing profiles, and manage the pictures and descriptions shown on the public website.</p>
          </div>

          <div className="admin-sidebar-stats">
            <article>
              <strong>{students.length}</strong>
              <span>Student records</span>
            </article>
            <article>
              <strong>{siteContent.heroSlides.length + siteContent.eventRows.length}</strong>
              <span>Homepage media blocks</span>
            </article>
          </div>

          <div className="admin-sidebar-nav" role="tablist" aria-label="Admin sections">
            <button
              type="button"
              className={activePanel === 'students' ? 'admin-nav-button active' : 'admin-nav-button'}
              onClick={() => setActivePanel('students')}
            >
              Student CRUD
            </button>
            <button
              type="button"
              className={activePanel === 'content' ? 'admin-nav-button active' : 'admin-nav-button'}
              onClick={() => setActivePanel('content')}
            >
              Homepage content
            </button>
          </div>
        </aside>

        <div className="admin-content">
          {feedback.text ? (
            <p className={feedback.type === 'error' ? 'feedback-banner is-error' : 'feedback-banner is-success'}>{feedback.text}</p>
          ) : null}

          {activePanel === 'students' ? (
            <div className="admin-grid">
              <article className="account-card admin-card">
                <div className="admin-card-heading">
                  <div>
                    <p className="section-kicker">Student form</p>
                    <h2>{selectedStudentId ? 'Update student' : 'Create student'}</h2>
                  </div>
                  {selectedStudentId ? (
                    <button type="button" className="secondary-action" onClick={() => setSelectedStudentId('')}>
                      Create new instead
                    </button>
                  ) : null}
                </div>

                <form className="account-form" onSubmit={handleStudentSubmit}>
                  <div className="form-columns">
                    <label>
                      Full name
                      <input
                        type="text"
                        value={studentForm.fullName}
                        onChange={(event) => handleStudentFieldChange('fullName', event.target.value)}
                        placeholder="Student full name"
                      />
                    </label>

                    <label>
                      Email address
                      <input
                        type="email"
                        value={studentForm.email}
                        onChange={(event) => handleStudentFieldChange('email', event.target.value)}
                        placeholder="student@def.edu"
                      />
                    </label>
                  </div>

                  <div className="form-columns">
                    <label>
                      Password {selectedStudentId ? '(optional)' : ''}
                      <input
                        type="password"
                        value={studentForm.password}
                        onChange={(event) => handleStudentFieldChange('password', event.target.value)}
                        placeholder={selectedStudentId ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                      />
                    </label>

                    <label>
                      Role
                      <select value={studentForm.role} onChange={(event) => handleStudentFieldChange('role', event.target.value)}>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-columns">
                    <label>
                      Academic year
                      <input
                        type="text"
                        value={studentForm.academicYear}
                        onChange={(event) => handleStudentFieldChange('academicYear', event.target.value)}
                        placeholder="2025-2026"
                      />
                    </label>

                    <label>
                      Location
                      <input
                        type="text"
                        value={studentForm.location}
                        onChange={(event) => handleStudentFieldChange('location', event.target.value)}
                        placeholder="City or campus"
                      />
                    </label>
                  </div>

                  <div className="form-columns">
                    <label>
                      Major 1
                      <input
                        type="text"
                        value={studentForm.major1}
                        onChange={(event) => handleStudentFieldChange('major1', event.target.value)}
                        placeholder="Primary major"
                      />
                    </label>

                    <label>
                      Major 2
                      <input
                        type="text"
                        value={studentForm.major2}
                        onChange={(event) => handleStudentFieldChange('major2', event.target.value)}
                        placeholder="Secondary major"
                      />
                    </label>
                  </div>

                  <label>
                    Bio
                    <textarea
                      rows="5"
                      value={studentForm.bio}
                      onChange={(event) => handleStudentFieldChange('bio', event.target.value)}
                      placeholder="Short introduction for the public profile"
                    />
                  </label>

                  <button className="primary-action" type="submit" disabled={isSavingStudent}>
                    {isSavingStudent ? 'Saving...' : selectedStudentId ? 'Update student' : 'Create student'}
                  </button>
                </form>
              </article>

              <article className="account-card admin-card">
                <div className="admin-card-heading">
                  <div>
                    <p className="section-kicker">Directory</p>
                    <h2>Existing students</h2>
                  </div>
                </div>

                <div className="admin-student-list">
                  {students.length ? students.map((student) => (
                    <article key={student.id} className="admin-student-item">
                      <div className="admin-student-summary">
                        <strong>{student.fullName}</strong>
                        <span>{student.email}</span>
                        <div className="admin-student-meta">
                          <span>{student.academicYear}</span>
                          <span>{student.role}</span>
                        </div>
                      </div>

                      <div className="admin-student-actions">
                        <button type="button" className="secondary-action" onClick={() => setSelectedStudentId(student.id)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-action"
                          onClick={() => handleStudentDelete(student)}
                          disabled={deletingStudentId === student.id}
                        >
                          {deletingStudentId === student.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  )) : <p className="loading-note">No students have been created yet.</p>}
                </div>
              </article>
            </div>
          ) : (
            <article className="account-card admin-card">
              <div className="admin-card-heading">
                <div>
                  <p className="section-kicker">Homepage editor</p>
                  <h2>Manage public images and descriptions</h2>
                </div>
              </div>

              <form className="account-form" onSubmit={(event) => {
                event.preventDefault()
                onSaveSiteContent(siteDraft)
              }}>
                <div className="admin-content-section">
                  <h3>Hero slides</h3>
                  {siteDraft.heroSlides.map((slide, index) => {
                    const uploadKey = `heroSlides:${slide.id}`

                    return (
                      <fieldset key={slide.id} className="admin-media-card">
                        <legend>Slide {index + 1}</legend>
                        <div className="admin-media-preview">
                          {slide.imageUrl ? <img src={getAssetUrl(slide.imageUrl)} alt={slide.caption} /> : <span>No image uploaded</span>}
                        </div>
                        <div className="form-columns">
                          <label>
                            Caption
                            <input
                              type="text"
                              value={slide.caption}
                              onChange={(event) => handleSiteFieldChange('heroSlides', index, 'caption', event.target.value)}
                            />
                          </label>
                          <label>
                            Title
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(event) => handleSiteFieldChange('heroSlides', index, 'title', event.target.value)}
                            />
                          </label>
                        </div>
                        <label>
                          Subtitle
                          <textarea
                            rows="4"
                            value={slide.subtitle}
                            onChange={(event) => handleSiteFieldChange('heroSlides', index, 'subtitle', event.target.value)}
                          />
                        </label>
                        <label className="secondary-action upload-action admin-upload-action">
                          {uploadingContentTarget === uploadKey ? 'Uploading...' : 'Upload slide image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                onUploadSiteImage('hero-slides', slide.id, file)
                              }
                              event.target.value = ''
                            }}
                            disabled={uploadingContentTarget === uploadKey}
                          />
                        </label>
                      </fieldset>
                    )
                  })}
                </div>

                <div className="admin-content-section">
                  <h3>Event rows</h3>
                  {siteDraft.eventRows.map((eventRow, index) => {
                    const uploadKey = `eventRows:${eventRow.id}`

                    return (
                      <fieldset key={eventRow.id} className="admin-media-card">
                        <legend>Event row {index + 1}</legend>
                        <div className="admin-media-preview landscape">
                          {eventRow.imageUrl ? <img src={getAssetUrl(eventRow.imageUrl)} alt={eventRow.description} /> : <span>No image uploaded</span>}
                        </div>
                        <label>
                          Description
                          <textarea
                            rows="4"
                            value={eventRow.description}
                            onChange={(event) => handleSiteFieldChange('eventRows', index, 'description', event.target.value)}
                          />
                        </label>
                        <label className="secondary-action upload-action admin-upload-action">
                          {uploadingContentTarget === uploadKey ? 'Uploading...' : 'Upload event image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                onUploadSiteImage('event-rows', eventRow.id, file)
                              }
                              event.target.value = ''
                            }}
                            disabled={uploadingContentTarget === uploadKey}
                          />
                        </label>
                      </fieldset>
                    )
                  })}
                </div>

                <div className="admin-content-section">
                  <h3>Footer copy</h3>
                  <div className="form-columns">
                    <label>
                      Footer title
                      <input
                        type="text"
                        value={siteDraft.footer.title}
                        onChange={(event) => handleFooterChange('title', event.target.value)}
                      />
                    </label>
                    <label>
                      Footer description
                      <textarea
                        rows="4"
                        value={siteDraft.footer.description}
                        onChange={(event) => handleFooterChange('description', event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <button className="primary-action" type="submit" disabled={isSavingSiteContent}>
                  {isSavingSiteContent ? 'Saving...' : 'Save homepage content'}
                </button>
              </form>
            </article>
          )}
        </div>
      </section>
    </main>
  )
}

export default AdminPage