import SectionHeading from '../../components/SectionHeading'

function StudioPanel({ draft, filterNames, filterStyles, onFieldChange, onImageChange, onPublish }) {
  const previewStyle = {
    filter: filterStyles[draft.selectedFilter],
    opacity: draft.intensity / 100,
  }

  return (
    <aside className="studio-panel" id="studio" data-reveal style={{ '--reveal-delay': '120ms' }}>
      <SectionHeading
        eyebrow="Upload studio"
        title="Create a new memory"
        copy="Add a picture, adjust the mood, and publish it straight into the alumni feed."
        compact
        delay={160}
      />

      <label className="upload-box" htmlFor="photo-upload" data-reveal style={{ '--reveal-delay': '220ms' }}>
        <input id="photo-upload" type="file" accept="image/*" onChange={onImageChange} />
        <span>Choose a photo</span>
        <small>PNG, JPG, or any image from your device</small>
      </label>

      <div className="preview-card" data-reveal style={{ '--reveal-delay': '280ms' }}>
        {draft.uploadedImage ? (
          <img src={draft.uploadedImage} alt="Preview of the selected alumni memory" style={previewStyle} />
        ) : (
          <div className="empty-preview">
            <strong>Preview area</strong>
            <p>Your image will appear here before you post it to DEF.</p>
          </div>
        )}
      </div>

      <div className="form-grid" data-reveal style={{ '--reveal-delay': '340ms' }}>
        <label>
          Alumni name
          <input
            type="text"
            value={draft.author}
            onChange={(event) => onFieldChange('author', event.target.value)}
            placeholder="Enter your name"
          />
        </label>

        <label>
          Graduation set
          <input
            type="text"
            value={draft.year}
            onChange={(event) => onFieldChange('year', event.target.value)}
            placeholder="Class of 2020"
          />
        </label>

        <label className="caption-field">
          Caption
          <textarea
            value={draft.caption}
            onChange={(event) => onFieldChange('caption', event.target.value)}
            placeholder="Write a short memory about the moment"
            rows="4"
          />
        </label>
      </div>

      <div className="editor-panel" data-reveal style={{ '--reveal-delay': '400ms' }}>
        <div>
          <p className="editor-label">Visual mood</p>
          <div className="filter-row">
            {filterNames.map((filterName) => (
              <button
                key={filterName}
                type="button"
                className={draft.selectedFilter === filterName ? 'filter-chip active' : 'filter-chip'}
                onClick={() => onFieldChange('selectedFilter', filterName)}
              >
                {filterName}
              </button>
            ))}
          </div>
        </div>

        <label className="range-field">
          Finish strength
          <input
            type="range"
            min="35"
            max="100"
            value={draft.intensity}
            onChange={(event) => onFieldChange('intensity', Number(event.target.value))}
          />
          <span>{draft.intensity}%</span>
        </label>
      </div>

      <button
        className="button button-primary publish-button"
        type="button"
        onClick={onPublish}
        data-reveal
        style={{ '--reveal-delay': '460ms' }}
      >
        Post to DEF
      </button>
    </aside>
  )
}

export default StudioPanel