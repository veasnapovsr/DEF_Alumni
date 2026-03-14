import SectionHeading from '../../components/SectionHeading'
import { storyHighlights } from '../../data/siteContent'
import PostCard from './PostCard'

function FeedPanel({ posts }) {
  return (
    <section className="feed-panel" id="feed" data-reveal>
      <SectionHeading
        eyebrow="Memory feed"
        title="Recent alumni snapshots"
        copy="A social gallery designed like a friendly photo app, focused on moments that bring DEF classmates back together."
        delay={80}
      />

      <div className="stories-row" aria-label="Alumni story highlights" data-reveal style={{ '--reveal-delay': '140ms' }}>
        {storyHighlights.map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </div>

      <div className="feed-list">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </section>
  )
}

export default FeedPanel