import { alumniSlides, heroStats } from '../../data/siteContent'
import AlumniSlideshow from './AlumniSlideshow'

function HeroSection() {
  return (
    <header className="hero" data-reveal>
      <nav className="topbar" data-reveal style={{ '--reveal-delay': '80ms' }}>
        <div className="topbar-brand">
          <p className="eyebrow">Department of French Alumni Platform</p>
          <h1>DEF</h1>
        </div>
        <div className="topbar-links">
          <a href="#feed">Memory Feed</a>
          <a href="#studio">Upload Studio</a>
          <a href="#moments">Why DEF</a>
        </div>
      </nav>

      <AlumniSlideshow slides={alumniSlides} stats={heroStats} />
    </header>
  )
}

export default HeroSection