function createMediaItem(url, type = 'image') {
  return {
    url,
    type: type === 'video' ? 'video' : 'image',
  }
}

export function getPostMediaItems(post) {
  if (Array.isArray(post?.media) && post.media.length) {
    return post.media
      .map((item) => createMediaItem(item?.url, item?.type))
      .filter((item) => item.url)
  }

  if (post?.videoUrl) {
    return [createMediaItem(post.videoUrl, 'video')]
  }

  if (Array.isArray(post?.imageUrls) && post.imageUrls.length) {
    return post.imageUrls.filter(Boolean).map((imageUrl) => createMediaItem(imageUrl, 'image'))
  }

  if (post?.imageUrl) {
    return [createMediaItem(post.imageUrl, 'image')]
  }

  return []
}

export function getPostImageUrls(post) {
  return getPostMediaItems(post)
    .filter((item) => item.type === 'image')
    .map((item) => item.url)
}

export function getPostMediaCount(post) {
  return getPostMediaItems(post).length
}

export function hasVideoMedia(post) {
  return getPostMediaItems(post).some((item) => item.type === 'video')
}

export function normalizePostMedia(post) {
  const media = getPostMediaItems(post)
  const imageUrls = media.filter((item) => item.type === 'image').map((item) => item.url)
  const videoUrl = media.find((item) => item.type === 'video')?.url || ''

  return {
    ...post,
    imageUrl: imageUrls[0] || '',
    imageUrls,
    videoUrl,
    media,
  }
}

export function normalizePostMediaCollection(posts) {
  return Array.isArray(posts) ? posts.map(normalizePostMedia) : []
}