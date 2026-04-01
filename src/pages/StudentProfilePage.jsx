import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PostImageCarousel from '../components/PostImageCarousel'
import { apiRequest, getAssetUrl } from '../utils/api'
import { getPostMediaCount, normalizePostMediaCollection } from '../utils/postMedia'

function buildProfileStats(student, text) {
  if (!student) {
    return []
  }

  const bioLength = student.bio?.trim().length || 0
  const completionScore = [student.fullName, student.major1, student.major2, student.bio, student.location, student.avatarUrl]
    .filter(Boolean)
    .length
  const postCount = student.posts?.length || 0

  return [
    { label: text.majors, value: student.major2 ? '2' : '1' },
    { label: text.posts, value: `${postCount}` },
    { label: text.profileScore, value: `${Math.min(completionScore * 15, 99)}%` },
    { label: text.bioWords, value: `${Math.max(1, Math.round(bioLength / 5))}` },
  ]
}

function StudentProfilePage({ currentUser, text, carouselText, dateLocale }) {
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadStudent = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await apiRequest(`/api/students/${studentId}`)

        if (!isCancelled) {
          setStudent({
            ...payload.student,
            posts: normalizePostMediaCollection(payload.student?.posts),
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setStudent(null)
          setErrorMessage(error.message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadStudent()

    return () => {
      isCancelled = true
    }
  }, [studentId])

  const profileStats = useMemo(() => buildProfileStats(student, text), [student, text])
  const isOwnProfile = currentUser?.id && student?.id === currentUser.id

  if (isLoading) {
    return (
      <main className="page-layout student-profile-layout">
        <section className="student-profile-shell" data-reveal>
          <p className="loading-note">{text.loading}</p>
        </section>
      </main>
    )
  }

  if (!student) {
    return (
      <main className="page-layout student-profile-layout">
        <section className="student-profile-shell" data-reveal>
          <div className="student-profile-empty">
            <p className="section-kicker">{text.kicker}</p>
            <h1>{text.notFound}</h1>
            <p>{errorMessage || text.notFoundCopy}</p>
            <Link className="secondary-action profile-nav-action" to="/#students">
              {text.backToStudents}
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-layout student-profile-layout">
      <section className="student-profile-shell" data-reveal style={{ '--reveal-delay': '60ms' }}>
        <div className="student-profile-banner" />

        <div className="student-profile-header">
          <div className="student-profile-avatar-wrap">
            <div className="student-profile-avatar" aria-hidden="true">
              {student.avatarUrl ? (
                <img className="avatar-image" src={getAssetUrl(student.avatarUrl)} alt={text.profileAlt(student.fullName)} />
              ) : (
                <div className="student-profile-avatar-fallback">
                  <span className="student-avatar-head" />
                  <span className="student-avatar-body" />
                </div>
              )}
            </div>
          </div>

          <div className="student-profile-intro">
            <div className="student-profile-topline">
              <div>
                <p className="section-kicker">{text.kicker}</p>
                <h1>{student.fullName}</h1>
              </div>
              <div className="student-profile-actions">
                <Link className="secondary-action profile-nav-action" to="/#students">
                  {text.backToStudents}
                </Link>
                {isOwnProfile ? (
                  <Link className="primary-action profile-nav-action" to="/profile">
                    {text.editMyPortal}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="student-profile-meta">
              <span>{student.academicYear}</span>
              <span>{student.location || text.defaultLocation}</span>
            </div>

            <div className="student-profile-stats">
              {profileStats.map((stat) => (
                <article key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="student-profile-grid">
          <article className="student-profile-card student-profile-bio">
            <p className="section-kicker">{text.about}</p>
            <h2>{text.bio}</h2>
            <p>{student.bio || text.noBio}</p>
          </article>

          <article className="student-profile-card">
            <p className="section-kicker">{text.academics}</p>
            <h2>{text.studyFocus}</h2>
            <dl className="student-profile-list">
              <div>
                <dt>{text.major1}</dt>
                <dd>{student.major1 || text.missingMajor}</dd>
              </div>
              <div>
                <dt>{text.major2}</dt>
                <dd>{student.major2 || text.missingMajor}</dd>
              </div>
              <div>
                <dt>{text.academicYear}</dt>
                <dd>{student.academicYear}</dd>
              </div>
            </dl>
          </article>

          <article className="student-profile-card student-profile-highlights">
            <p className="section-kicker">{text.highlights}</p>
            <h2>{text.portalSnapshot}</h2>
            <div className="student-highlight-grid">
              <div>
                <span>{text.location}</span>
                <strong>{student.location || text.notAddedYet}</strong>
              </div>
              <div>
                <span>{text.directoryStatus}</span>
                <strong>{text.visible}</strong>
              </div>
              <div>
                <span>{text.photo}</span>
                <strong>{student.avatarUrl ? text.uploaded : text.placeholder}</strong>
              </div>
              <div>
                <span>{text.community}</span>
                <strong>{text.communityValue}</strong>
              </div>
            </div>
          </article>
        </div>

        <section className="student-posts-section">
          <div className="student-posts-heading">
            <div>
              <p className="section-kicker">{text.photos}</p>
              <h2>{text.postGallery}</h2>
            </div>
            <p>{student.posts?.length ? text.sharedPictures : text.noPostsShared}</p>
          </div>

          {student.posts?.length ? (
            <div className="student-post-grid">
              {student.posts.map((post) => (
                <article key={post.id} className="student-post-card">
                  <div className="student-post-image-wrap">
                    <PostImageCarousel
                      post={post}
                      altText={post.caption || text.postAlt(student.fullName)}
                      imageClassName="student-post-image"
                      labels={carouselText}
                    />
                  </div>
                  <div className="student-post-meta">
                    <span>{text.photoCount(getPostMediaCount(post))}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString(dateLocale)}</span>
                  </div>
                  <p>{post.caption}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="student-post-empty">
              <p>{text.noPhotosYet}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default StudentProfilePage
