import { useEffect } from 'react'

function useScrollReveal(dependencyKey) {
  useEffect(() => {
    const revealNodes = document.querySelectorAll('[data-reveal]')

    if (!revealNodes.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -48px 0px',
      },
    )

    revealNodes.forEach((node) => observer.observe(node))

    return () => {
      observer.disconnect()
    }
  }, [dependencyKey])
}

export default useScrollReveal