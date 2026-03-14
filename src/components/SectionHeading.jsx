function SectionHeading({ eyebrow, title, copy, compact = false, delay = 0 }) {
  const className = compact ? 'section-heading compact' : 'section-heading'

  return (
    <div className={className} data-reveal style={{ '--reveal-delay': `${delay}ms` }}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      <p className="section-copy">{copy}</p>
    </div>
  )
}

export default SectionHeading