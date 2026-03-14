import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PostImageCarousel from '../components/PostImageCarousel'
import { apiRequest, getAssetUrl } from '../utils/api'
import { getPostImageUrls, normalizePostMediaCollection } from '../utils/postMedia'

function buildProfileStats(student) {
  if (!student) {
    return []
  }

  const bioLength = student.bio?.trim().length || 0
  const completionScore = [student.fullName, student.major1, student.major2, student.bio, student.location, student.avatarUrl]
    .filter(Boolean)
    .length
  const postCount = student.posts?.length || 0

  return [
    { label: 'Majors', value: student.major2 ? '2' : '1' },
    { label: 'Posts', value: `${postCount}` },
    { label: 'Profile score', value: `${Math.min(completionScore * 15, 99)}%` },
    { label: 'Bio words', value: `${Math.max(1, Math.round(bioLength / 5))}` },
  ]
}

function StudentProfilePage({ currentUser }) {
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

  const profileStats = useMemo(() => buildProfileStats(student), [student])
  const isOwnProfile = currentUser?.id && student?.id === currentUser.id

  if (isLoading) {
    return (
      <main className="page-layout student-profile-layout">
        <section className="student-profile-shell" data-reveal>
          <p className="loading-note">Loading student profile...</p>
        </section>
      </main>
    )
  }

  if (!student) {
    return (
      <main className="page-layout student-profile-layout">
        <section className="student-profile-shell" data-reveal>
          <div className="student-profile-empty">
            <p className="section-kicker">Student profile</p>
            <h1>Profile not found</h1>
            <p>{errorMessage || 'This student profile does not exist or is no longer available.'}</p>
            <Link className="secondary-action profile-nav-action" to="/#students">
              Back to students
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
                <img className="avatar-image" src={getAssetUrl(student.avatarUrl)} alt={`${student.fullName} profile`} />
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
                <p className="section-kicker">Student profile</p>
                <h1>{student.fullName}</h1>
              </div>
              <div className="student-profile-actions">
                <Link className="secondary-action profile-nav-action" to="/#students">
                  Back to students
                </Link>
                {isOwnProfile ? (
                  <Link className="primary-action profile-nav-action" to="/profile">
                    Edit my portal
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="student-profile-meta">
              <span>{student.academicYear}</span>
              <span>{student.location || 'Department of French'}</span>
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
            <p className="section-kicker">About</p>
            <h2>Bio</h2>
            <p>{student.bio || 'This student has not added a bio yet.'}</p>
          </article>

          <article className="student-profile-card">
            <p className="section-kicker">Academics</p>
            <h2>Study focus</h2>
            <dl className="student-profile-list">
              <div>
                <dt>Major 1</dt>
                <dd>{student.major1}</dd>
              </div>
              <div>
                <dt>Major 2</dt>
                <dd>{student.major2}</dd>
              </div>
              <div>
                <dt>Academic year</dt>
                <dd>{student.academicYear}</dd>
              </div>
            </dl>
          </article>

          <article className="student-profile-card student-profile-highlights">
            <p className="section-kicker">Highlights</p>
            <h2>Portal snapshot</h2>
            <div className="student-highlight-grid">
              <div>
                <span>Location</span>
                <strong>{student.location || 'Not added yet'}</strong>
              </div>
              <div>
                <span>Directory status</span>
                <strong>Visible</strong>
              </div>
              <div>
                <span>Photo</span>
                <strong>{student.avatarUrl ? 'Uploaded' : 'Placeholder'}</strong>
              </div>
              <div>
                <span>Community</span>
                <strong>DEF Student</strong>
              </div>
            </div>
          </article>
        </div>

        <section className="student-posts-section">
          <div className="student-posts-heading">
            <div>
              <p className="section-kicker">Photos</p>
              <h2>Post gallery</h2>
            </div>
            <p>{student.posts?.length ? 'Shared pictures with caption descriptions.' : 'No posts have been shared yet.'}</p>
          </div>

          {student.posts?.length ? (
            <div className="student-post-grid">
              {student.posts.map((post) => (
                <article key={post.id} className="student-post-card">
                  <div className="student-post-image-wrap">
                    <PostImageCarousel
                      post={post}
                      altText={post.caption || `${student.fullName} post`}
                      imageClassName="student-post-image"
                    />
                  </div>
                  <div className="student-post-meta">
                    <span>{getPostImageUrls(post).length} photos</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{post.caption}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="student-post-empty">
              <p>This student has not posted photos yet.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default StudentProfilePage
