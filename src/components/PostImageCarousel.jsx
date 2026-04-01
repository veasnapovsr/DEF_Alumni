import { useEffect, useRef, useState } from 'react'
import { getAssetUrl } from '../utils/api'
import { getPostMediaItems } from '../utils/postMedia'

const defaultLabels = {
  previousPhoto: 'Show previous photo',
  nextPhoto: 'Show next photo',
  photoNavigation: 'Post photo navigation',
  showPhoto: (index) => `Show photo ${index}`,
  postImageAlt: (index) => `Post image ${index}`,
}

function CarouselBody({ mediaItems, post, altText, imageClassName, autoPlay, intervalMs, labels }) {
  const touchStartX = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const canAutoPlay = autoPlay && !mediaItems.some((item) => item.type === 'video')

  useEffect(() => {
    if (!canAutoPlay || mediaItems.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % mediaItems.length)
    }, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [canAutoPlay, intervalMs, mediaItems.length])

  const goToSlide = (index) => {
    setActiveIndex(index)
  }

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1))
  }

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % mediaItems.length)
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
          {mediaItems.map((item, index) => (
            item.type === 'video' ? (
              <video
                key={`${post?.id || 'post'}-${item.url}-${index}`}
                className={`post-image-carousel-image ${imageClassName}`.trim()}
                src={getAssetUrl(item.url)}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                key={`${post?.id || 'post'}-${item.url}-${index}`}
                className={`post-image-carousel-image ${imageClassName}`.trim()}
                src={getAssetUrl(item.url)}
                alt={altText || labels.postImageAlt(index + 1)}
              />
            )
          ))}
        </div>
      </div>

      {mediaItems.length > 1 ? (
        <>
          <button type="button" className="post-image-carousel-nav is-prev" onClick={goToPrevious} aria-label={labels.previousPhoto}>
            ‹
          </button>
          <button type="button" className="post-image-carousel-nav is-next" onClick={goToNext} aria-label={labels.nextPhoto}>
            ›
          </button>

          <div className="post-image-carousel-dots" aria-label={labels.photoNavigation}>
            {mediaItems.map((item, index) => (
              <button
                key={`${post?.id || 'post'}-dot-${item.url}-${index}`}
                type="button"
                className={index === activeIndex ? 'post-image-carousel-dot is-active' : 'post-image-carousel-dot'}
                onClick={() => goToSlide(index)}
                aria-label={labels.showPhoto(index + 1)}
              />
            ))}
          </div>

          <span className="post-image-carousel-count">{activeIndex + 1}/{mediaItems.length}</span>
        </>
      ) : null}
    </div>
  )
}

function PostImageCarousel({ post, altText, imageClassName = '', autoPlay = true, intervalMs = 3200, labels = defaultLabels }) {
  const mediaItems = getPostMediaItems(post)

  if (!mediaItems.length) {
    return null
  }

  const carouselKey = `${post?.id || 'post'}:${mediaItems.map((item) => `${item.type}:${item.url}`).join('|')}`

  return (
    <CarouselBody
      key={carouselKey}
      mediaItems={mediaItems}
      post={post}
      altText={altText}
      imageClassName={imageClassName}
      autoPlay={autoPlay}
      intervalMs={intervalMs}
      labels={labels}
    />
  )
}

export default PostImageCarousel