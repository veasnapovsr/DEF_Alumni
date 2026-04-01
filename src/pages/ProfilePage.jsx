import { useState } from 'react'
import { Link } from 'react-router-dom'
import PostImageCarousel from '../components/PostImageCarousel'
import { getAssetUrl } from '../utils/api'
import { getPostMediaCount, getPostMediaItems, hasVideoMedia } from '../utils/postMedia'

function ProfilePage({
  currentUser,
  authForm,
  onAuthFieldChange,
  onAuthSubmit,
  isSubmittingAuth,
  profileForm,
  onProfileFieldChange,
  onProfileSave,
  isSavingProfile,
  passwordForm,
  onPasswordFieldChange,
  onPasswordChange,
  isChangingPassword,
  onAvatarChange,
  isUploadingAvatar,
  postForm,
  onPostFieldChange,
  onPostSubmit,
  isCreatingPost,
  onUpdatePost,
  isUpdatingPost,
  onDeletePost,
  deletingPostId,
  onLogout,
  isLoadingSession,
  feedback,
  text,
  carouselText,
  dateLocale,
}) {
  const isAdmin = currentUser?.role === 'admin'
  const [editingPostId, setEditingPostId] = useState('')
  const [editingCaption, setEditingCaption] = useState('')
  const [editingMediaItems, setEditingMediaItems] = useState([])

  const handleEditStart = (post) => {
    setEditingPostId(post.id)
    setEditingCaption(post.caption || '')
    setEditingMediaItems(getPostMediaItems(post))
  }

  const handleEditCancel = () => {
    setEditingPostId('')
    setEditingCaption('')
    setEditingMediaItems([])
  }

  const handleRemoveEditingMedia = (mediaUrl) => {
    setEditingMediaItems((currentMediaItems) => currentMediaItems.filter((currentMediaItem) => currentMediaItem.url !== mediaUrl))
  }

  const handleEditSubmit = async (event, postId) => {
    event.preventDefault()

    if (!editingMediaItems.length) {
      return
    }

    const isSaved = await onUpdatePost(postId, editingCaption, editingMediaItems.map((item) => item.url))

    if (isSaved) {
      handleEditCancel()
    }
  }

  const handleDeleteClick = async (postId) => {
    const shouldDelete = window.confirm(text.deletePostConfirm)

    if (!shouldDelete) {
      return
    }

    const isDeleted = await onDeletePost(postId)

    if (isDeleted && editingPostId === postId) {
      handleEditCancel()
    }
  }

  return (
    <main className="page-layout profile-page-layout">
      <section className="profile-page-hero" data-reveal style={{ '--reveal-delay': '60ms' }}>
        <div className="profile-page-copy">
          <p className="section-kicker">{text.pageKicker}</p>
          <h1>{currentUser ? text.heroLoggedInTitle : text.heroLoggedOutTitle}</h1>
          <p>{text.heroCopy}</p>
        </div>

        <div className="profile-page-actions">
          <Link className="secondary-action profile-nav-action" to="/#students">
            {text.backToStudents}
          </Link>
          <Link className="secondary-action profile-nav-action" to="/#events">
            {text.viewServerFeatures}
          </Link>
          {isAdmin ? (
            <Link className="primary-action profile-nav-action" to="/admin">
              {text.openAdminPanel}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="account-panel" data-reveal style={{ '--reveal-delay': '120ms' }}>
        <div className="panel-heading account-heading">
          <div>
            <p className="section-kicker">{text.accountPortal}</p>
            <h2>{currentUser ? text.manageStudentProfile : text.loginToAccount}</h2>
          </div>
          <p className="account-copy">{text.accountCopy}</p>
        </div>

        {feedback.text ? (
          <p className={feedback.type === 'error' ? 'feedback-banner is-error' : 'feedback-banner is-success'}>{feedback.text}</p>
        ) : null}

        <div className="account-grid">
          <article className="account-card auth-card">
            {!currentUser ? (
              <>
                <form className="account-form" onSubmit={onAuthSubmit}>
                  <label>
                    {text.emailAddress}
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => onAuthFieldChange('email', event.target.value)}
                      placeholder={text.emailPlaceholder}
                    />
                  </label>

                  <label>
                    {text.password}
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => onAuthFieldChange('password', event.target.value)}
                      placeholder={text.passwordPlaceholder}
                    />
                  </label>

                  <button className="primary-action" type="submit" disabled={isSubmittingAuth}>
                    {isSubmittingAuth ? text.processing : text.login}
                  </button>
                </form>
              </>
            ) : (
              <div className="account-summary">
                <div className="account-summary-avatar">
                  <div className="profile-avatar large-avatar" aria-hidden="true">
                    {currentUser.avatarUrl ? (
                      <img className="avatar-image" src={getAssetUrl(currentUser.avatarUrl)} alt={text.profileAlt(currentUser.fullName)} />
                    ) : (
                      <>
                        <span className="profile-avatar-head" />
                        <span className="profile-avatar-body" />
                      </>
                    )}
                  </div>
                  <label className="secondary-action upload-action">
                    {isUploadingAvatar ? text.uploading : text.uploadPicture}
                    <input type="file" accept="image/*" onChange={onAvatarChange} disabled={isUploadingAvatar} />
                  </label>
                </div>

                <div className="account-summary-copy">
                  <strong>{currentUser.fullName}</strong>
                  <span>{currentUser.email}</span>
                  <p>{currentUser.bio}</p>
                </div>

                <button type="button" className="ghost-action" onClick={onLogout}>
                  {text.logout}
                </button>
              </div>
            )}
          </article>

          <article className="account-card editor-card">
            {currentUser ? (
              <form className="account-form" onSubmit={onProfileSave}>
                <div className="form-columns">
                  <label>
                    {text.fullName}
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) => onProfileFieldChange('fullName', event.target.value)}
                      placeholder={text.fullNamePlaceholder}
                    />
                  </label>

                  <label>
                    {text.academicYear}
                    <input
                      type="text"
                      value={profileForm.academicYear}
                      onChange={(event) => onProfileFieldChange('academicYear', event.target.value)}
                      placeholder={text.academicYearPlaceholder}
                    />
                  </label>
                </div>

                <div className="form-columns">
                  <label>
                    {text.major1}
                    <input
                      type="text"
                      value={profileForm.major1}
                      onChange={(event) => onProfileFieldChange('major1', event.target.value)}
                      placeholder={text.major1Placeholder}
                    />
                  </label>

                  <label>
                    {text.major2}
                    <input
                      type="text"
                      value={profileForm.major2}
                      onChange={(event) => onProfileFieldChange('major2', event.target.value)}
                      placeholder={text.major2Placeholder}
                    />
                  </label>
                </div>

                <label>
                  {text.location}
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(event) => onProfileFieldChange('location', event.target.value)}
                    placeholder={text.locationPlaceholder}
                  />
                </label>

                <label>
                  {text.bio}
                  <textarea
                    rows="5"
                    value={profileForm.bio}
                    onChange={(event) => onProfileFieldChange('bio', event.target.value)}
                    placeholder={text.bioPlaceholder}
                  />
                </label>

                <button className="primary-action" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? text.saving : text.saveProfile}
                </button>
              </form>
            ) : (
              <div className="editor-placeholder">
                <strong>{text.profileToolsTitle}</strong>
                <p>{text.profileToolsCopy}</p>
                <ul>
                  <li>{text.secureLogin}</li>
                  <li>{text.editableInfo}</li>
                  <li>{text.avatarUpload}</li>
                </ul>
                {isLoadingSession ? <span className="loading-note">{text.checkingSession}</span> : null}
              </div>
            )}
          </article>
        </div>

        {currentUser ? (
          <article className="account-card password-card">
            <div>
              <p className="section-kicker">{text.security}</p>
              <h2>{text.changePassword}</h2>
            </div>

            <form className="account-form" onSubmit={onPasswordChange}>
              <div className="form-columns">
                <label>
                  {text.currentPassword}
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => onPasswordFieldChange('currentPassword', event.target.value)}
                    placeholder={text.currentPasswordPlaceholder}
                  />
                </label>

                <label>
                  {text.newPassword}
                  <input
                    type="password"
                    value={passwordForm.nextPassword}
                    onChange={(event) => onPasswordFieldChange('nextPassword', event.target.value)}
                    placeholder={text.newPasswordPlaceholder}
                  />
                </label>
              </div>

              <label>
                {text.confirmNewPassword}
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => onPasswordFieldChange('confirmPassword', event.target.value)}
                  placeholder={text.confirmNewPasswordPlaceholder}
                />
              </label>

              <button className="primary-action" type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? text.updatingPassword : text.updatePassword}
              </button>
            </form>
          </article>
        ) : null}

        {currentUser ? (
          <div className="profile-posts-layout">
            <article className="account-card post-composer-card">
              <div>
                <p className="section-kicker">{text.createPost}</p>
                <h2>{text.shareNewPhoto}</h2>
                <p className="post-composer-copy">{text.postComposerCopy}</p>
              </div>

              <form className="account-form post-composer-form" onSubmit={onPostSubmit}>
                <label className="post-upload-field">
                  <span>{text.choosePhotos}</span>
                  <small>{text.choosePhotosHelp}</small>
                  <input name="postMedia" type="file" accept="image/*,video/*" multiple disabled={isCreatingPost} />
                </label>

                <label className="post-caption-field">
                  {text.description}
                  <textarea
                    rows="3"
                    value={postForm.caption}
                    onChange={(event) => onPostFieldChange(event.target.value)}
                    placeholder={text.descriptionPlaceholder}
                  />
                </label>

                <div className="post-composer-actions">
                  <button className="primary-action post-publish-button" type="submit" disabled={isCreatingPost}>
                    {isCreatingPost ? text.posting : text.postPhoto}
                  </button>
                </div>
              </form>
            </article>

            <article className="account-card my-posts-card">
              <div className="my-posts-heading">
                <div>
                  <p className="section-kicker">{text.myPosts}</p>
                  <h2>{text.publishedPhotos}</h2>
                </div>
                <span className="my-posts-count">{text.postsCount(currentUser.posts?.length || 0)}</span>
              </div>

              <div className="my-posts-toolbar" aria-label={text.galleryNavigation}>
                <span className="my-posts-tab is-active">{text.postsTab}</span>
                <span className="my-posts-tab">{text.galleryTab}</span>
              </div>

              {currentUser.posts?.length ? (
                <div className="profile-post-grid">
                  {currentUser.posts.map((post) => (
                    <article key={post.id} className="profile-post-card">
                      <div className="profile-post-image-wrap">
                        <PostImageCarousel
                          post={post}
                          altText={post.caption || text.profileAlt(currentUser.fullName)}
                          imageClassName="profile-post-image"
                          labels={carouselText}
                        />
                        <div className="profile-post-overlay">
                          <p>{post.caption || text.sharedFromGallery}</p>
                        </div>
                      </div>
                      <div className="profile-post-meta">
                        <span>{text.photoCount(getPostMediaCount(post))}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString(dateLocale)}</span>
                      </div>

                      {editingPostId === post.id ? (
                        <form className="profile-post-editor" onSubmit={(event) => handleEditSubmit(event, post.id)}>
                          <label>
                            {text.editDescription}
                            <textarea
                              rows="3"
                              value={editingCaption}
                              onChange={(event) => setEditingCaption(event.target.value)}
                              placeholder={text.editDescriptionPlaceholder}
                            />
                          </label>
                          <div className="profile-post-edit-gallery">
                            {editingMediaItems.map((mediaItem, index) => (
                              <article key={`${post.id}-${mediaItem.url}-${index}`} className="profile-post-edit-tile">
                                {mediaItem.type === 'video' ? (
                                  <video src={getAssetUrl(mediaItem.url)} controls playsInline preload="metadata" />
                                ) : (
                                  <img src={getAssetUrl(mediaItem.url)} alt={text.postPhotoAlt(index + 1)} />
                                )}
                                <button
                                  className="ghost-action profile-post-image-delete"
                                  type="button"
                                  onClick={() => handleRemoveEditingMedia(mediaItem.url)}
                                  disabled={editingMediaItems.length === 1 || isUpdatingPost || hasVideoMedia(post)}
                                >
                                  {editingMediaItems.length === 1 || hasVideoMedia(post) ? text.keepOnePhoto : text.removePhoto}
                                </button>
                              </article>
                            ))}
                          </div>
                          <div className="profile-post-actions">
                            <button className="primary-action profile-post-action" type="submit" disabled={isUpdatingPost}>
                              {isUpdatingPost ? text.saving : text.save}
                            </button>
                            <button className="secondary-action profile-post-action" type="button" onClick={handleEditCancel} disabled={isUpdatingPost}>
                              {text.cancel}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="profile-post-body">
                          <p className="profile-post-caption">{post.caption || text.sharedFromGallery}</p>
                          <div className="profile-post-actions">
                            <button className="secondary-action profile-post-action" type="button" onClick={() => handleEditStart(post)}>
                              {text.edit}
                            </button>
                            <button
                              className="ghost-action profile-post-action"
                              type="button"
                              onClick={() => handleDeleteClick(post.id)}
                              disabled={deletingPostId === post.id}
                            >
                              {deletingPostId === post.id ? text.deleting : text.delete}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-posts-note">{text.noPostsYet}</p>
              )}
            </article>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default ProfilePage
