export function getPostImageUrls(post) {
  if (Array.isArray(post?.imageUrls) && post.imageUrls.length) {
    return post.imageUrls.filter(Boolean)
  }

  if (post?.imageUrl) {
    return [post.imageUrl]
  }

  return []
}

export function normalizePostMedia(post) {
  const imageUrls = getPostImageUrls(post)

  return {
    ...post,
    imageUrl: imageUrls[0] || '',
    imageUrls,
  }
}

export function normalizePostMediaCollection(posts) {
  return Array.isArray(posts) ? posts.map(normalizePostMedia) : []
}