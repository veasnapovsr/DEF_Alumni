function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const durationSeconds = Number(video.duration)
      URL.revokeObjectURL(objectUrl)

      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        reject(new Error('Unable to read the selected video duration.'))
        return
      }

      resolve(durationSeconds)
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read the selected video.'))
    }
    video.src = objectUrl
  })
}

export default readVideoDuration