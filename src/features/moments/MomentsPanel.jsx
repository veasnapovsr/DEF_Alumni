import { moments } from '../../data/siteContent'

function MomentsPanel() {
  return (
    <section className="moments-panel" id="moments">
      <article data-reveal>
        <p className="eyebrow">Why DEF works</p>
        <h3>A fun space for alumni memories</h3>
      </article>

      {moments.map((moment, index) => (
        <article key={moment.title} data-reveal style={{ '--reveal-delay': `${100 + index * 90}ms` }}>
          <strong>{moment.title}</strong>
          <p>{moment.description}</p>
        </article>
      ))}
    </section>
  )
}

export default MomentsPanel