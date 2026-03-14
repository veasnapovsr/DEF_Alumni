import { Link } from 'react-router-dom'
import PostImageCarousel from '../components/PostImageCarousel'
import { getAssetUrl } from '../utils/api'

function HomePage({
  heroSlides,
  activeSlide,
  onSlideChange,
  highlightStudents,
  studentPages,
  currentStudentPage,
  onStudentsTouchStart,
  onStudentsTouchEnd,
  onStudentPageChange,
  eventRows,
}) {
  return (
    <main className="page-layout">
      <section className="hero-panel" id="photos" data-reveal style={{ '--reveal-delay': '60ms' }}>
        <div className="hero-viewport">
          <div className="hero-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            {heroSlides.map((slide) => {
              const hasBackgroundPhoto = Boolean(slide.imageUrl)

              return (
                <article
                  key={slide.id}
                  className={hasBackgroundPhoto ? 'hero-slide hero-slide-with-background' : 'hero-slide'}
                  style={hasBackgroundPhoto ? { '--hero-slide-image': `url("${getAssetUrl(slide.imageUrl)}")` } : undefined}
                >
                  <div className={hasBackgroundPhoto ? 'hero-slide-shell hero-slide-shell-overlay' : 'hero-slide-shell'}>
                    <p className="hero-slide-label">{slide.caption}</p>
                    <div className={hasBackgroundPhoto ? 'hero-slide-body hero-slide-body-overlay' : 'hero-slide-body'}>
                      <h1>{slide.title}</h1>
                      <p>{slide.subtitle}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="section-pager" aria-label="Photo slides">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeSlide ? 'pager-dot active' : 'pager-dot'}
              onClick={() => onSlideChange(index)}
              aria-label={`Show slide ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </section>

      <section className="students-panel" id="students" data-reveal style={{ '--reveal-delay': '120ms' }}>
        <div className="panel-heading centered">
          <h2>Students</h2>
        </div>

        <div className="students-viewport" onTouchStart={onStudentsTouchStart} onTouchEnd={onStudentsTouchEnd}>
          <div className="students-track" style={{ transform: `translateX(-${currentStudentPage * 100}%)` }}>
            {studentPages.map((studentPage, pageIndex) => (
              <div
                key={`student-page-${pageIndex + 1}`}
                className="students-page"
                style={{ '--student-columns': studentPage.length }}
              >
                {studentPage.map((student) => (
                  <article key={student.id} className="student-card">
                    <div className="student-avatar" aria-hidden="true">
                      {student.avatarUrl ? (
                        <img className="avatar-image" src={getAssetUrl(student.avatarUrl)} alt={`${student.fullName} avatar`} />
                      ) : (
                        <>
                          <span className="student-avatar-head" />
                          <span className="student-avatar-body" />
                        </>
                      )}
                    </div>

                    <dl className="student-details">
                      <div>
                        <dt>Name :</dt>
                        <dd>{student.fullName}</dd>
                      </div>
                      <div>
                        <dt>Major 1 :</dt>
                        <dd>{student.major1}</dd>
                      </div>
                      <div>
                        <dt>Major 2 :</dt>
                        <dd>{student.major2}</dd>
                      </div>
                    </dl>

                    <Link className="profile-link" to={`/students/${student.id}`}>
                      view profile page
                    </Link>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="section-pager" aria-label="Students pages">
          {studentPages.map((_, index) => (
            <button
              key={`students-page-${index + 1}`}
              type="button"
              className={index === currentStudentPage ? 'pager-dot active' : 'pager-dot'}
              onClick={() => onStudentPageChange(index)}
              aria-label={`Show student group ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </section>

      <section className="student-highlights-panel" data-reveal style={{ '--reveal-delay': '160ms' }}>
        <div className="panel-heading centered">
          <div className="student-highlights-heading-block">
            <p className="section-kicker">Spotlight</p>
            <h2>Student Highlights</h2>
          </div>
        </div>

        {highlightStudents.length ? (
          <div className="student-highlights-grid instagram-highlight-grid">
            {highlightStudents.map((student) => (
              <article
                key={student.id}
                className="student-highlight-card instagram-highlight-card"
              >
                <div className="student-highlight-topbar">
                  <div className="student-highlight-profilemark" aria-hidden="true">
                    <img
                      className="student-highlight-photo"
                      src={getAssetUrl(student.imageUrl)}
                      alt={`${student.fullName} gallery highlight`}
                    />
                  </div>
                  <div className="student-highlight-profilecopy">
                    <strong>{student.fullName}</strong>
                    <small>{student.totalPhotos} photo{student.totalPhotos > 1 ? 's' : ''} in gallery</small>
                  </div>
                  <Link className="student-highlight-profilelink" to={`/students/${student.studentId}`}>
                    View profile
                  </Link>
                </div>

                <div className="student-highlight-media-shell">
                  <PostImageCarousel
                    post={{ id: student.id, imageUrls: student.imageUrls }}
                    altText={`${student.fullName} gallery highlight`}
                    imageClassName="student-highlight-photo student-highlight-photo-main"
                    intervalMs={2600}
                  />
                </div>

                <div className="student-highlight-copy student-highlight-copy-static">
                  <span>{student.caption || 'Shared from student gallery.'}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="student-highlights-empty">
            <p>No gallery photos have been shared yet.</p>
          </div>
        )}
      </section>

      <section className="events-panel" id="events" data-reveal style={{ '--reveal-delay': '180ms' }}>
        <div className="panel-heading centered">
          <h2>Events</h2>
        </div>

        <div className="events-list">
          {eventRows.map((eventRow, index) => {
            const isReversed = index % 2 === 1

            return (
              <article
                key={eventRow.id}
                className={isReversed ? 'event-row reversed' : 'event-row'}
                data-reveal
                style={{ '--reveal-delay': `${240 + index * 80}ms` }}
              >
                <div className="event-copy-content">
                  <strong>{eventRow.description}</strong>
                </div>

                <div className="event-card event-photo-card">
                  {eventRow.imageUrl ? (
                    <img
                      className="event-photo"
                      src={getAssetUrl(eventRow.imageUrl)}
                      alt={eventRow.description}
                    />
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default HomePage
