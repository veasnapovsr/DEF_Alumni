import { useEffect, useRef, useState } from 'react'
import { getAssetUrl } from '../utils/api'
import { getPostImageUrls } from '../utils/postMedia'

const defaultLabels = {
  previousPhoto: 'Show previous photo',
  nextPhoto: 'Show next photo',
  photoNavigation: 'Post photo navigation',
  showPhoto: (index) => `Show photo ${index}`,
  postImageAlt: (index) => `Post image ${index}`,
}

function PostImageCarousel({ post, altText, imageClassName = '', autoPlay = true, intervalMs = 3200, labels = defaultLabels }) {
  const imageUrls = getPostImageUrls(post)
  const touchStartX = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [post?.id, imageUrls.length])

  useEffect(() => {
    if (!autoPlay || imageUrls.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % imageUrls.length)
    }, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [autoPlay, imageUrls.length, intervalMs, post?.id])

  if (!imageUrls.length) {
    return null
  }

  const goToSlide = (index) => {
    setActiveIndex(index)
  }

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? imageUrls.length - 1 : currentIndex - 1))
  }

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % imageUrls.length)
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? 0
  }

  const handleTouchEnd = (event) => {
    const touchEndX = event.changedTouches[0]?.clientX ?? 0
    const swipeDistance = touchStartX.current - touchEndX

    if (Math.abs(swipeDistance) < 40) {
      return
    }

    if (swipeDistance > 0) {
      goToNext()
      return
    }

    goToPrevious()
  }

  return (
    <div className="post-image-carousel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="post-image-carousel-viewport">
        <div className="post-image-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {imageUrls.map((imageUrl, index) => (
            <img
              key={`${post?.id || 'post'}-${imageUrl}-${index}`}
              className={`post-image-carousel-image ${imageClassName}`.trim()}
              src={getAssetUrl(imageUrl)}
              alt={altText || labels.postImageAlt(index + 1)}
            />
          ))}
        </div>
      </div>

      {imageUrls.length > 1 ? (
        <>
          <button type="button" className="post-image-carousel-nav is-prev" onClick={goToPrevious} aria-label={labels.previousPhoto}>
            ‹
          </button>
          <button type="button" className="post-image-carousel-nav is-next" onClick={goToNext} aria-label={labels.nextPhoto}>
            ›
          </button>

          <div className="post-image-carousel-dots" aria-label={labels.photoNavigation}>
            {imageUrls.map((imageUrl, index) => (
              <button
                key={`${post?.id || 'post'}-dot-${imageUrl}-${index}`}
                type="button"
                className={index === activeIndex ? 'post-image-carousel-dot is-active' : 'post-image-carousel-dot'}
                onClick={() => goToSlide(index)}
                aria-label={labels.showPhoto(index + 1)}
              />
            ))}
          </div>

          <span className="post-image-carousel-count">{activeIndex + 1}/{imageUrls.length}</span>
        </>
      ) : null}
    </div>
  )
}

export default PostImageCarousel