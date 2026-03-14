import { useEffect, useState } from 'react'
import { getAssetUrl } from '../../utils/api'

function AlumniSlideshow({ slides, stats }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
    }, 3600)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [slides.length])

  const activeSlide = slides[activeIndex]

  const handlePrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + slides.length) % slides.length)
  }

  const handleNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
  }

  return (
    <section
      className="hero-showcase"
      aria-label="Alumni slideshow"
      data-reveal
      style={{
        '--reveal-delay': '120ms',
        '--slide-accent': activeSlide.accent,
        '--slide-secondary': activeSlide.secondary,
      }}
    >
      <div className="hero-slider-viewport">
        <div className="hero-slider-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {slides.map((slide) => (
            <article key={`${slide.name}-${slide.year}`} className="hero-showcase-slide">
              <div className="hero-slide-content">
                <div className="hero-slide-copy">
                  <span className="pill hero-pill">{slide.eyebrow}</span>
                  <h2>{slide.title}</h2>
                  <p>
                    DEF is a playful memory platform for alumni students of the Department of French.
                    Upload pictures, adjust the look, post your reunion highlights, and let old friends
                    return to one place for laughter, nostalgia, and connection.
                  </p>

                  <div className="hero-actions">
                    <a className="button button-primary" href="#studio">
                      Upload a memory
                    </a>
                    <a className="button button-secondary" href="#feed">
                      Explore alumni posts
                    </a>
                  </div>

                  <div className="stats-row hero-stats-row">
                    {stats.map((stat) => (
                      <article key={stat.label}>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="hero-slide-meta">
                  <p className="hero-slide-label">Alumni spotlight</p>
                  <strong>{slide.name}</strong>
                  <span>{slide.year}</span>
                  <p>{slide.memory}</p>
                  <small>{slide.theme}</small>
                </div>
              </div>

              <div className="hero-slide-visual">
                <div
                  className="hero-slide-photo-frame"
                  style={{ '--slide-frame-accent': slide.accent, '--slide-frame-secondary': slide.secondary }}
                >
                  <img
                    className="hero-slide-photo"
                    src={getAssetUrl(slide.image)}
                    alt={`${slide.name} alumni portrait`}
                  />
                  <div className="hero-slide-badge">DEF alumni campaign</div>
                </div>

                <div className="hero-slide-strip">
                  {slides.map((stripSlide, index) => (
                    <button
                      key={`${stripSlide.name}-${stripSlide.year}`}
                      type="button"
                      className={index === activeIndex ? 'hero-strip-card active' : 'hero-strip-card'}
                      onClick={() => setActiveIndex(index)}
                    >
                      <img src={getAssetUrl(stripSlide.image)} alt="" />
                      <span>{stripSlide.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="hero-slider-controls">
        <button type="button" className="hero-arrow" onClick={handlePrevious} aria-label="Show previous slide">
          Prev
        </button>

        <div className="hero-slider-dots">
          {slides.map((slide, index) => (
            <button
              key={`${slide.name}-${slide.year}`}
              type="button"
              className={index === activeIndex ? 'hero-dot active' : 'hero-dot'}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${slide.name}`}
            />
          ))}
        </div>

        <button type="button" className="hero-arrow" onClick={handleNext} aria-label="Show next slide">
          Next
        </button>
      </div>
    </section>
  )
}

export default AlumniSlideshow