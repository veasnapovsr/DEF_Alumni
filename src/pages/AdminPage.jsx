import { useState } from 'react'
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

function serializeSiteContent(siteContent) {
  return JSON.stringify(siteContent)
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
  text,
  commonText,
}) {
  const [activePanel, setActivePanel] = useState('students')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentForm, setStudentForm] = useState(() => createStudentDraft(null))
  const [siteDraftState, setSiteDraftState] = useState(() => ({
    sourceKey: serializeSiteContent(siteContent),
    draft: cloneSiteContent(siteContent),
  }))
  const siteContentKey = serializeSiteContent(siteContent)
  const siteDraft = siteDraftState.sourceKey === siteContentKey ? siteDraftState.draft : cloneSiteContent(siteContent)

  const handleStudentFieldChange = (field, value) => {
    setStudentForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleSiteFieldChange = (section, index, field, value) => {
    setSiteDraftState({
      sourceKey: siteContentKey,
      draft: {
        ...siteDraft,
        [section]: siteDraft[section].map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
        )),
      },
    })
  }

  const handleFooterChange = (field, value) => {
    setSiteDraftState({
      sourceKey: siteContentKey,
      draft: {
        ...siteDraft,
        footer: {
          ...siteDraft.footer,
        [field]: value,
        },
      },
    })
  }

  const handleCreateNewStudent = () => {
    setSelectedStudentId('')
    setStudentForm(createStudentDraft(null))
  }

  const handleStudentSelect = (student) => {
    setSelectedStudentId(student.id)
    setStudentForm(createStudentDraft(student))
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
    const confirmed = window.confirm(text.deleteStudentConfirm(student.fullName))

    if (!confirmed) {
      return
    }

    await onDeleteStudent(student.id)

    if (selectedStudentId === student.id) {
      handleCreateNewStudent()
    }
  }

  if (isLoadingSession) {
    return (
      <main className="page-layout admin-page-layout">
        <section className="admin-shell" data-reveal>
          <p className="loading-note">{text.loading}</p>
        </section>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="page-layout admin-page-layout">
        <section className="admin-shell admin-empty-state" data-reveal>
          <p className="section-kicker">{text.panel}</p>
          <h1>{text.loginRequired}</h1>
          <p>{text.loginRequiredCopy}</p>
          <Link className="primary-action profile-nav-action" to="/profile">
            {text.goToLogin}
          </Link>
        </section>
      </main>
    )
  }

  if (currentUser.role !== 'admin') {
    return (
      <main className="page-layout admin-page-layout">
        <section className="admin-shell admin-empty-state" data-reveal>
          <p className="section-kicker">{text.panel}</p>
          <h1>{text.accessDenied}</h1>
          <p>{text.accessDeniedCopy}</p>
          <Link className="secondary-action profile-nav-action" to="/">
            {text.returnHome}
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
            <p className="section-kicker">{text.panel}</p>
            <h1>{text.manageTitle}</h1>
            <p>{text.manageCopy}</p>
          </div>

          <div className="admin-sidebar-stats">
            <article>
              <strong>{students.length}</strong>
              <span>{text.studentRecords}</span>
            </article>
            <article>
              <strong>{siteContent.heroSlides.length + siteContent.eventRows.length}</strong>
              <span>{text.homepageMediaBlocks}</span>
            </article>
          </div>

          <div className="admin-sidebar-nav" role="tablist" aria-label={text.adminSections}>
            <button
              type="button"
              className={activePanel === 'students' ? 'admin-nav-button active' : 'admin-nav-button'}
              onClick={() => setActivePanel('students')}
            >
              {text.studentCrud}
            </button>
            <button
              type="button"
              className={activePanel === 'content' ? 'admin-nav-button active' : 'admin-nav-button'}
              onClick={() => setActivePanel('content')}
            >
              {text.homepageContent}
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
                    <p className="section-kicker">{text.studentForm}</p>
                    <h2>{selectedStudentId ? text.updateStudent : text.createStudent}</h2>
                  </div>
                  {selectedStudentId ? (
                    <button type="button" className="secondary-action" onClick={handleCreateNewStudent}>
                      {text.createNewInstead}
                    </button>
                  ) : null}
                </div>

                <form className="account-form" onSubmit={handleStudentSubmit}>
                  <div className="form-columns">
                    <label>
                      {text.fullName}
                      <input
                        type="text"
                        value={studentForm.fullName}
                        onChange={(event) => handleStudentFieldChange('fullName', event.target.value)}
                        placeholder={text.fullNamePlaceholder}
                      />
                    </label>

                    <label>
                      {text.emailAddress}
                      <input
                        type="email"
                        value={studentForm.email}
                        onChange={(event) => handleStudentFieldChange('email', event.target.value)}
                        placeholder={text.emailPlaceholder}
                      />
                    </label>
                  </div>

                  <div className="form-columns">
                    <label>
                      {selectedStudentId ? text.passwordOptional : text.password}
                      <input
                        type="password"
                        value={studentForm.password}
                        onChange={(event) => handleStudentFieldChange('password', event.target.value)}
                        placeholder={selectedStudentId ? text.leaveBlankPassword : text.minimumPassword}
                      />
                    </label>

                    <label>
                      {text.role}
                      <select value={studentForm.role} onChange={(event) => handleStudentFieldChange('role', event.target.value)}>
                        <option value="student">{text.studentRole}</option>
                        <option value="admin">{text.adminRole}</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-columns">
                    <label>
                      {text.academicYear}
                      <input
                        type="text"
                        value={studentForm.academicYear}
                        onChange={(event) => handleStudentFieldChange('academicYear', event.target.value)}
                        placeholder={text.academicYearPlaceholder}
                      />
                    </label>

                    <label>
                      {text.location}
                      <input
                        type="text"
                        value={studentForm.location}
                        onChange={(event) => handleStudentFieldChange('location', event.target.value)}
                        placeholder={text.locationPlaceholder}
                      />
                    </label>
                  </div>

                  <div className="form-columns">
                    <label>
                      {text.major1}
                      <input
                        type="text"
                        value={studentForm.major1}
                        onChange={(event) => handleStudentFieldChange('major1', event.target.value)}
                        placeholder={text.major1Placeholder}
                      />
                    </label>

                    <label>
                      {text.major2}
                      <input
                        type="text"
                        value={studentForm.major2}
                        onChange={(event) => handleStudentFieldChange('major2', event.target.value)}
                        placeholder={text.major2Placeholder}
                      />
                    </label>
                  </div>

                  <label>
                    {text.bio}
                    <textarea
                      rows="5"
                      value={studentForm.bio}
                      onChange={(event) => handleStudentFieldChange('bio', event.target.value)}
                      placeholder={text.bioPlaceholder}
                    />
                  </label>

                  <button className="primary-action" type="submit" disabled={isSavingStudent}>
                    {isSavingStudent ? text.saving : selectedStudentId ? text.updateStudent : text.createStudent}
                  </button>
                </form>
              </article>

              <article className="account-card admin-card">
                <div className="admin-card-heading">
                  <div>
                    <p className="section-kicker">{text.directory}</p>
                    <h2>{text.existingStudents}</h2>
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
                          <span>{text.roleLabel(student.role)}</span>
                        </div>
                      </div>

                      <div className="admin-student-actions">
                        <button type="button" className="secondary-action" onClick={() => handleStudentSelect(student)}>
                          {text.edit}
                        </button>
                        <button
                          type="button"
                          className="ghost-action"
                          onClick={() => handleStudentDelete(student)}
                          disabled={deletingStudentId === student.id}
                        >
                          {deletingStudentId === student.id ? text.deleting : text.delete}
                        </button>
                      </div>
                    </article>
                  )) : <p className="loading-note">{text.noStudents}</p>}
                </div>
              </article>
            </div>
          ) : (
            <article className="account-card admin-card">
              <div className="admin-card-heading">
                <div>
                  <p className="section-kicker">{text.homepageEditor}</p>
                  <h2>{text.managePublicContent}</h2>
                </div>
              </div>

              <form className="account-form" onSubmit={(event) => {
                event.preventDefault()
                onSaveSiteContent(siteDraft)
              }}>
                <div className="admin-content-section">
                  <h3>{text.heroSlides}</h3>
                  {siteDraft.heroSlides.map((slide, index) => {
                    const uploadKey = `heroSlides:${slide.id}`

                    return (
                      <fieldset key={slide.id} className="admin-media-card">
                        <legend>{text.slide(index + 1)}</legend>
                        <div className="admin-media-preview">
                          {slide.imageUrl ? <img src={getAssetUrl(slide.imageUrl)} alt={slide.caption} /> : <span>{commonText.noImageUploaded}</span>}
                        </div>
                        <div className="form-columns">
                          <label>
                            {text.caption}
                            <input
                              type="text"
                              value={slide.caption}
                              onChange={(event) => handleSiteFieldChange('heroSlides', index, 'caption', event.target.value)}
                            />
                          </label>
                          <label>
                            {text.title}
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(event) => handleSiteFieldChange('heroSlides', index, 'title', event.target.value)}
                            />
                          </label>
                        </div>
                        <label>
                          {text.subtitle}
                          <textarea
                            rows="4"
                            value={slide.subtitle}
                            onChange={(event) => handleSiteFieldChange('heroSlides', index, 'subtitle', event.target.value)}
                          />
                        </label>
                        <label className="secondary-action upload-action admin-upload-action">
                          {uploadingContentTarget === uploadKey ? text.uploading : text.uploadSlideImage}
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
                  <h3>{text.eventRows}</h3>
                  {siteDraft.eventRows.map((eventRow, index) => {
                    const uploadKey = `eventRows:${eventRow.id}`

                    return (
                      <fieldset key={eventRow.id} className="admin-media-card">
                        <legend>{text.eventRow(index + 1)}</legend>
                        <div className="admin-media-preview landscape">
                          {eventRow.imageUrl ? <img src={getAssetUrl(eventRow.imageUrl)} alt={eventRow.description} /> : <span>{commonText.noImageUploaded}</span>}
                        </div>
                        <label>
                          {text.description}
                          <textarea
                            rows="4"
                            value={eventRow.description}
                            onChange={(event) => handleSiteFieldChange('eventRows', index, 'description', event.target.value)}
                          />
                        </label>
                        <label className="secondary-action upload-action admin-upload-action">
                          {uploadingContentTarget === uploadKey ? text.uploading : text.uploadEventImage}
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
                  <h3>{text.footerCopy}</h3>
                  <div className="form-columns">
                    <label>
                      {text.footerTitle}
                      <input
                        type="text"
                        value={siteDraft.footer.title}
                        onChange={(event) => handleFooterChange('title', event.target.value)}
                      />
                    </label>
                    <label>
                      {text.footerDescription}
                      <textarea
                        rows="4"
                        value={siteDraft.footer.description}
                        onChange={(event) => handleFooterChange('description', event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <button className="primary-action" type="submit" disabled={isSavingSiteContent}>
                  {isSavingSiteContent ? text.saving : text.saveHomepageContent}
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