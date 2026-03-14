function PostCard({ post, index }) {
  return (
    <article className="post-card" data-reveal style={{ '--reveal-delay': `${120 + index * 70}ms` }}>
      <div className="post-head">
        <div>
          <strong>{post.author}</strong>
          <span>{post.year}</span>
        </div>
        <span className="post-mood">{post.mood}</span>
      </div>

      {post.image ? (
        <div className="post-image-frame">
          <img
            className="post-image"
            src={post.image}
            alt={`${post.author} shared memory`}
            style={{
              filter: post.filter,
              opacity: post.intensity / 100,
            }}
          />
        </div>
      ) : (
        <div className={`post-art post-art-${post.palette}`}>
          <span>DEF</span>
          <p>{post.caption}</p>
        </div>
      )}

      <p className="post-caption">{post.caption}</p>

      <div className="post-meta">
        <span>{post.likes} likes</span>
        <span>{post.comments} comments</span>
      </div>
    </article>
  )
}

export default PostCard