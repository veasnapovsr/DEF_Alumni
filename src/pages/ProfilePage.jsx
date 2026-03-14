import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PostImageCarousel from '../components/PostImageCarousel'
import { getAssetUrl } from '../utils/api'
import { getPostImageUrls } from '../utils/postMedia'

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
}) {
  const isAdmin = currentUser?.role === 'admin'
  const [editingPostId, setEditingPostId] = useState('')
  const [editingCaption, setEditingCaption] = useState('')
  const [editingImageUrls, setEditingImageUrls] = useState([])

  useEffect(() => {
    setEditingPostId('')
    setEditingCaption('')
    setEditingImageUrls([])
  }, [currentUser?.id, currentUser?.posts])

  const handleEditStart = (post) => {
    setEditingPostId(post.id)
    setEditingCaption(post.caption || '')
    setEditingImageUrls(getPostImageUrls(post))
  }

  const handleEditCancel = () => {
    setEditingPostId('')
    setEditingCaption('')
    setEditingImageUrls([])
  }

  const handleRemoveEditingImage = (imageUrl) => {
    setEditingImageUrls((currentImageUrls) => currentImageUrls.filter((currentImageUrl) => currentImageUrl !== imageUrl))
  }

  const handleEditSubmit = async (event, postId) => {
    event.preventDefault()

    if (!editingImageUrls.length) {
      return
    }

    const isSaved = await onUpdatePost(postId, editingCaption, editingImageUrls)

    if (isSaved) {
      handleEditCancel()
    }
  }

  const handleDeleteClick = async (postId) => {
    const shouldDelete = window.confirm('Delete this post and all of its photos?')

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
          <p className="section-kicker">Profile page</p>
          <h1>{currentUser ? 'Your DEF portal account' : 'Student profile access'}</h1>
          <p>
            This page is dedicated to account access and profile management. Students can log in,
            upload a picture, and edit the information that appears in the public student directory.
          </p>
        </div>

        <div className="profile-page-actions">
          <Link className="secondary-action profile-nav-action" to="/#students">
            Back to students
          </Link>
          <Link className="secondary-action profile-nav-action" to="/#events">
            View server features
          </Link>
          {isAdmin ? (
            <Link className="primary-action profile-nav-action" to="/admin">
              Open admin panel
            </Link>
          ) : null}
        </div>
      </section>

      <section className="account-panel" data-reveal style={{ '--reveal-delay': '120ms' }}>
        <div className="panel-heading account-heading">
          <div>
            <p className="section-kicker">Account portal</p>
            <h2>{currentUser ? 'Manage your student profile' : 'Log in to your account'}</h2>
          </div>
          <p className="account-copy">Students can log in, upload a profile picture, and update personal information that feeds the public student directory.</p>
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
                    Email address
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => onAuthFieldChange('email', event.target.value)}
                      placeholder="student@def.edu"
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => onAuthFieldChange('password', event.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </label>

                  <button className="primary-action" type="submit" disabled={isSubmittingAuth}>
                    {isSubmittingAuth ? 'Processing...' : 'Login'}
                  </button>
                </form>
              </>
            ) : (
              <div className="account-summary">
                <div className="account-summary-avatar">
                  <div className="profile-avatar large-avatar" aria-hidden="true">
                    {currentUser.avatarUrl ? (
                      <img className="avatar-image" src={getAssetUrl(currentUser.avatarUrl)} alt={`${currentUser.fullName} profile`} />
                    ) : (
                      <>
                        <span className="profile-avatar-head" />
                        <span className="profile-avatar-body" />
                      </>
                    )}
                  </div>
                  <label className="secondary-action upload-action">
                    {isUploadingAvatar ? 'Uploading...' : 'Upload picture'}
                    <input type="file" accept="image/*" onChange={onAvatarChange} disabled={isUploadingAvatar} />
                  </label>
                </div>

                <div className="account-summary-copy">
                  <strong>{currentUser.fullName}</strong>
                  <span>{currentUser.email}</span>
                  <p>{currentUser.bio}</p>
                </div>

                <button type="button" className="ghost-action" onClick={onLogout}>
                  Logout
                </button>
              </div>
            )}
          </article>

          <article className="account-card editor-card">
            {currentUser ? (
              <form className="account-form" onSubmit={onProfileSave}>
                <div className="form-columns">
                  <label>
                    Full name
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) => onProfileFieldChange('fullName', event.target.value)}
                      placeholder="Enter your full name"
                    />
                  </label>

                  <label>
                    Academic year
                    <input
                      type="text"
                      value={profileForm.academicYear}
                      onChange={(event) => onProfileFieldChange('academicYear', event.target.value)}
                      placeholder="2025-2026"
                    />
                  </label>
                </div>

                <div className="form-columns">
                  <label>
                    Major 1
                    <input
                      type="text"
                      value={profileForm.major1}
                      onChange={(event) => onProfileFieldChange('major1', event.target.value)}
                      placeholder="Primary major"
                    />
                  </label>

                  <label>
                    Major 2
                    <input
                      type="text"
                      value={profileForm.major2}
                      onChange={(event) => onProfileFieldChange('major2', event.target.value)}
                      placeholder="Secondary major"
                    />
                  </label>
                </div>

                <label>
                  Location
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(event) => onProfileFieldChange('location', event.target.value)}
                    placeholder="City or campus location"
                  />
                </label>

                <label>
                  Bio
                  <textarea
                    rows="5"
                    value={profileForm.bio}
                    onChange={(event) => onProfileFieldChange('bio', event.target.value)}
                    placeholder="Write a short introduction for your public card"
                  />
                </label>

                <button className="primary-action" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </form>
            ) : (
              <div className="editor-placeholder">
                <strong>Profile tools unlock after login</strong>
                <p>Log in with an existing student account to edit majors, upload a picture, and publish your personal information into the students section.</p>
                <ul>
                  <li>Secure login with a stored session</li>
                  <li>Editable personal information</li>
                  <li>Avatar upload backed by the server</li>
                </ul>
                {isLoadingSession ? <span className="loading-note">Checking for an existing session...</span> : null}
              </div>
            )}
          </article>
        </div>

        {currentUser ? (
          <article className="account-card password-card">
            <div>
              <p className="section-kicker">Security</p>
              <h2>Change your password</h2>
            </div>

            <form className="account-form" onSubmit={onPasswordChange}>
              <div className="form-columns">
                <label>
                  Current password
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => onPasswordFieldChange('currentPassword', event.target.value)}
                    placeholder="Enter your current password"
                  />
                </label>

                <label>
                  New password
                  <input
                    type="password"
                    value={passwordForm.nextPassword}
                    onChange={(event) => onPasswordFieldChange('nextPassword', event.target.value)}
                    placeholder="At least 6 characters"
                  />
                </label>
              </div>

              <label>
                Confirm new password
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => onPasswordFieldChange('confirmPassword', event.target.value)}
                  placeholder="Re-enter the new password"
                />
              </label>

              <button className="primary-action" type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          </article>
        ) : null}

        {currentUser ? (
          <div className="profile-posts-layout">
            <article className="account-card post-composer-card">
              <div>
                <p className="section-kicker">Create post</p>
                <h2>Share a new photo</h2>
                <p className="post-composer-copy">Upload 1 to 5 pictures in one post and add one description for the full gallery set.</p>
              </div>

              <form className="account-form post-composer-form" onSubmit={onPostSubmit}>
                <label className="post-upload-field">
                  <span>Choose photos</span>
                  <small>Pick between 1 and 5 images for one post</small>
                  <input name="postImages" type="file" accept="image/*" multiple disabled={isCreatingPost} />
                </label>

                <label className="post-caption-field">
                  Description
                  <textarea
                    rows="3"
                    value={postForm.caption}
                    onChange={(event) => onPostFieldChange(event.target.value)}
                    placeholder="Write a description under the photo"
                  />
                </label>

                <div className="post-composer-actions">
                  <button className="primary-action post-publish-button" type="submit" disabled={isCreatingPost}>
                    {isCreatingPost ? 'Posting...' : 'Post photo'}
                  </button>
                </div>
              </form>
            </article>

            <article className="account-card my-posts-card">
              <div className="my-posts-heading">
                <div>
                  <p className="section-kicker">My posts</p>
                  <h2>Published photos</h2>
                </div>
                <span className="my-posts-count">{currentUser.posts?.length || 0} posts</span>
              </div>

              <div className="my-posts-toolbar" aria-label="Gallery navigation">
                <span className="my-posts-tab is-active">Posts</span>
                <span className="my-posts-tab">Gallery</span>
              </div>

              {currentUser.posts?.length ? (
                <div className="profile-post-grid">
                  {currentUser.posts.map((post) => (
                    <article key={post.id} className="profile-post-card">
                      <div className="profile-post-image-wrap">
                        <PostImageCarousel
                          post={post}
                          altText={post.caption || `${currentUser.fullName} post`}
                          imageClassName="profile-post-image"
                        />
                        <div className="profile-post-overlay">
                          <p>{post.caption || 'Shared from your student gallery.'}</p>
                        </div>
                      </div>
                      <div className="profile-post-meta">
                        <span>{getPostImageUrls(post).length} photos</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      {editingPostId === post.id ? (
                        <form className="profile-post-editor" onSubmit={(event) => handleEditSubmit(event, post.id)}>
                          <label>
                            Edit description
                            <textarea
                              rows="3"
                              value={editingCaption}
                              onChange={(event) => setEditingCaption(event.target.value)}
                              placeholder="Write a description for this post"
                            />
                          </label>
                          <div className="profile-post-edit-gallery">
                            {editingImageUrls.map((imageUrl, index) => (
                              <article key={`${post.id}-${imageUrl}-${index}`} className="profile-post-edit-tile">
                                <img src={getAssetUrl(imageUrl)} alt={`Post photo ${index + 1}`} />
                                <button
                                  className="ghost-action profile-post-image-delete"
                                  type="button"
                                  onClick={() => handleRemoveEditingImage(imageUrl)}
                                  disabled={editingImageUrls.length === 1 || isUpdatingPost}
                                >
                                  {editingImageUrls.length === 1 ? 'Keep 1 photo' : 'Remove photo'}
                                </button>
                              </article>
                            ))}
                          </div>
                          <div className="profile-post-actions">
                            <button className="primary-action profile-post-action" type="submit" disabled={isUpdatingPost}>
                              {isUpdatingPost ? 'Saving...' : 'Save'}
                            </button>
                            <button className="secondary-action profile-post-action" type="button" onClick={handleEditCancel} disabled={isUpdatingPost}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="profile-post-body">
                          <p className="profile-post-caption">{post.caption || 'Shared from your student gallery.'}</p>
                          <div className="profile-post-actions">
                            <button className="secondary-action profile-post-action" type="button" onClick={() => handleEditStart(post)}>
                              Edit
                            </button>
                            <button
                              className="ghost-action profile-post-action"
                              type="button"
                              onClick={() => handleDeleteClick(post.id)}
                              disabled={deletingPostId === post.id}
                            >
                              {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-posts-note">No posts yet. Share your first photo from this page.</p>
              )}
            </article>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default ProfilePage
