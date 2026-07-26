import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { client, mediaUrl } from '../api/client'
import DashboardOrbs from '../components/DashboardOrbs'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatVisitDate } from '../lib/visitDates'
import './Dashboard.css'
import './Memories.css'

/**
 * @typedef {Object} MemoryImage
 * @property {string} id
 * @property {string} url
 * @property {string | null} [originalName]
 * @property {string | null} [caption]
 */

/**
 * @typedef {Object} Memory
 * @property {string} id
 * @property {string | null} title
 * @property {string | null} note
 * @property {string | null} visitId
 * @property {string | null} dateIdeaId
 * @property {{ start_date: string, end_date: string, visitingPartner?: { displayName: string } | null } | null} [visit]
 * @property {{ title: string, category: string } | null} [dateIdea]
 * @property {MemoryImage[]} images
 */

/**
 * @typedef {Object} VisitSource
 * @property {'visit'} type
 * @property {string} id
 * @property {string} start_date
 * @property {string} end_date
 * @property {{ displayName: string } | null} [visitingPartner]
 * @property {string | null} memoryId
 */

/**
 * @typedef {Object} DateIdeaSource
 * @property {'dateIdea'} type
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string | null} memoryId
 */

/** @typedef {VisitSource | DateIdeaSource} MemorySource */

/**
 * @param {Memory} memory
 */
function memoryHeading(memory) {
  if (memory.title) return memory.title
  if (memory.dateIdea?.title) return memory.dateIdea.title
  if (memory.visit) {
    return `Visit · ${formatVisitDate(memory.visit.start_date)}`
  }
  return 'Memory'
}

/**
 * @param {MemorySource} source
 */
function sourceHeading(source) {
  if (source.type === 'visit') {
    return `Visit · ${formatVisitDate(source.start_date)}`
  }
  return source.title
}

/**
 * @param {MemorySource} source
 */
function sourceBlurb(source) {
  if (source.type === 'visit') {
    const traveler = source.visitingPartner?.displayName
    const range = `${formatVisitDate(source.start_date)} – ${formatVisitDate(source.end_date)}`
    return traveler ? `${range} · ${traveler} visited` : range
  }
  return source.description || source.category
}

/**
 * @param {Memory | null} memory
 * @param {MemorySource} source
 * @param {boolean} creating
 */
function sourceActionLabel(memory, source, creating) {
  if (creating) return 'Opening…'
  if (!source.memoryId) return 'Start album'
  const album = memory
  if (album && album.images.length === 0) return 'Add photos'
  return 'Open album'
}

export default function Memories() {
  const [paired, setPaired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [memories, setMemories] = useState(/** @type {Memory[]} */ ([]))
  const [sources, setSources] = useState(/** @type {MemorySource[]} */ ([]))
  const [viewMemoryId, setViewMemoryId] = useState(/** @type {string | null} */ (null))
  const [editMemoryId, setEditMemoryId] = useState(/** @type {string | null} */ (null))
  const [noteDraft, setNoteDraft] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [creatingSourceId, setCreatingSourceId] = useState(/** @type {string | null} */ (null))
  const [deletingImageId, setDeletingImageId] = useState(/** @type {string | null} */ (null))

  const viewMemory = useMemo(
    () => memories.find((memory) => memory.id === viewMemoryId) ?? null,
    [memories, viewMemoryId],
  )
  const editMemory = useMemo(
    () => memories.find((memory) => memory.id === editMemoryId) ?? null,
    [memories, editMemoryId],
  )

  const loadPage = useCallback(async () => {
    setError('')
    setLoading(true)

    try {
      const coupleData = await client('/api/couples/me')
      setPaired(Boolean(coupleData.paired))

      if (!coupleData.paired) {
        setMemories([])
        setSources([])
        return
      }

      const [memoryData, sourceData] = await Promise.all([
        client('/api/memories'),
        client('/api/memories/sources'),
      ])

      setMemories(Array.isArray(memoryData.memories) ? memoryData.memories : [])
      setSources(Array.isArray(sourceData.sources) ? sourceData.sources : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load memories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  useEffect(() => {
    if (!editMemory) {
      setTitleDraft('')
      setNoteDraft('')
      return
    }
    setTitleDraft(editMemory.title ?? '')
    setNoteDraft(editMemory.note ?? '')
  }, [editMemory])

  useEffect(() => {
    if (!viewMemoryId) return

    /**
     * @param {KeyboardEvent} event
     */
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setViewMemoryId(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [viewMemoryId])

  /**
   * @param {string} memoryId
   */
  function openAlbumViewer(memoryId) {
    setEditMemoryId(null)
    setViewMemoryId(memoryId)
  }

  /**
   * @param {string} memoryId
   */
  function openAlbumEditor(memoryId) {
    setViewMemoryId(null)
    setEditMemoryId(memoryId)
  }

  /**
   * @param {MemorySource} source
   */
  async function openSource(source) {
    setError('')

    if (source.memoryId) {
      const existing = memories.find((memory) => memory.id === source.memoryId)
      if (existing && existing.images.length > 0) {
        openAlbumViewer(source.memoryId)
      } else {
        openAlbumEditor(source.memoryId)
      }
      return
    }

    setCreatingSourceId(source.id)
    try {
      const body =
        source.type === 'visit'
          ? { visitId: source.id }
          : { dateIdeaId: source.id }

      const data = await client('/api/memories', { body })
      const memory = data.memory
      setMemories((prev) => [memory, ...prev.filter((item) => item.id !== memory.id)])
      setSources((prev) =>
        prev.map((item) =>
          item.id === source.id ? { ...item, memoryId: memory.id } : item,
        ),
      )
      openAlbumEditor(memory.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start this memory.')
    } finally {
      setCreatingSourceId(null)
    }
  }

  async function saveMemoryMeta() {
    if (!editMemory) return
    setSavingMeta(true)
    setError('')

    try {
      const data = await client(`/api/memories/${editMemory.id}`, {
        method: 'PATCH',
        body: { title: titleDraft, note: noteDraft },
      })
      setMemories((prev) =>
        prev.map((item) => (item.id === editMemory.id ? data.memory : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save memory details.')
    } finally {
      setSavingMeta(false)
    }
  }

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  async function handleUpload(event) {
    if (!editMemory) return
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('images', file))

      const data = await client(`/api/memories/${editMemory.id}/images`, {
        method: 'POST',
        body: formData,
      })

      if (data.memory) {
        setMemories((prev) =>
          prev.map((item) => (item.id === editMemory.id ? data.memory : item)),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload images.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  /**
   * @param {string} imageId
   */
  async function handleDeleteImage(imageId) {
    if (!editMemory) return
    setDeletingImageId(imageId)
    setError('')

    try {
      await client(`/api/memories/${editMemory.id}/images/${imageId}`, {
        method: 'DELETE',
      })
      setMemories((prev) =>
        prev.map((item) =>
          item.id === editMemory.id
            ? {
                ...item,
                images: item.images.filter((image) => image.id !== imageId),
              }
            : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete that photo.')
    } finally {
      setDeletingImageId(null)
    }
  }

  const visitSources = sources.filter((source) => source.type === 'visit')
  const ideaSources = sources.filter((source) => source.type === 'dateIdea')
  const memoriesWithPhotos = memories.filter((memory) => memory.images.length > 0)

  /**
   * @param {MemorySource} source
   */
  function renderSourceButton(source) {
    const linked = source.memoryId
      ? memories.find((memory) => memory.id === source.memoryId) ?? null
      : null
    const isEditing = editMemoryId === source.memoryId
    const isViewing = viewMemoryId === source.memoryId

    return (
      <button
        key={source.id}
        type="button"
        className={
          isEditing || isViewing ? 'memory-source is-active' : 'memory-source'
        }
        onClick={() => openSource(source)}
        disabled={creatingSourceId === source.id}
      >
        <span className="memory-source__title">{sourceHeading(source)}</span>
        <span className="memory-source__blurb">{sourceBlurb(source)}</span>
        <span className="memory-source__meta">
          {sourceActionLabel(linked, source, creatingSourceId === source.id)}
        </span>
      </button>
    )
  }

  return (
    <div className="dashboard-page">
      <DashboardOrbs />

      <section className="dashboard-page__content dashboard-page__content--wide">
        <h1 className="dashboard-page__title">Memories</h1>
        <p className="dashboard-page__text">
          Look back on past visits and completed date ideas, then upload photos from your time together.
        </p>

        {loading ? (
          <LoadingSpinner label="Loading your memories..." />
        ) : error && !paired ? (
          <ErrorBanner message={error} onDismiss={() => setError('')} />
        ) : !paired ? (
          <p className="dashboard-page__text">
            You need to be paired first.{' '}
            <Link to="/pair" className="dashboard-page__link">
              Connect with your partner
            </Link>{' '}
            to save shared memories.
          </p>
        ) : (
          <div className="dashboard-page__stack">
            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {memoriesWithPhotos.length > 0 ? (
              <div>
                <p className="dashboard-page__label">Recent photos</p>
                <div className="memory-highlights">
                  {memoriesWithPhotos.slice(0, 6).map((memory) => {
                    const cover = memory.images[0]
                    return (
                      <button
                        key={memory.id}
                        type="button"
                        className="memory-highlight"
                        onClick={() => openAlbumViewer(memory.id)}
                      >
                        <img src={mediaUrl(cover.url)} alt="" className="memory-highlight__img" />
                        <span className="memory-highlight__caption">{memoryHeading(memory)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="memory-layout">
              <div className="memory-sources">
                <div>
                  <p className="dashboard-page__label">Past visits</p>
                  {visitSources.length === 0 ? (
                    <p className="dashboard-page__text" style={{ margin: 0 }}>
                      Past visits will show up here once a trip ends.
                    </p>
                  ) : (
                    <div className="memory-source-list">
                      {visitSources.map(renderSourceButton)}
                    </div>
                  )}
                </div>

                <div>
                  <p className="dashboard-page__label">Completed date ideas</p>
                  {ideaSources.length === 0 ? (
                    <p className="dashboard-page__text" style={{ margin: 0 }}>
                      Mark a date idea as completed to add photos here.
                    </p>
                  ) : (
                    <div className="memory-source-list">
                      {ideaSources.map(renderSourceButton)}
                    </div>
                  )}
                </div>
              </div>

              <div className="memory-detail">
                {!editMemory ? (
                  <div className="memory-detail__empty">
                    <p className="memory-detail__empty-title">Pick a moment</p>
                    <p className="dashboard-page__text" style={{ margin: 0 }}>
                      Open an album to browse photos, or start one to upload new memories.
                    </p>
                  </div>
                ) : (
                  <div className="memory-detail__panel">
                    <div className="memory-detail__header">
                      <div>
                        <span className="memory-detail__badge">Manage album</span>
                        <h2 className="memory-detail__title">{memoryHeading(editMemory)}</h2>
                        {editMemory.visit ? (
                          <p className="memory-detail__meta">
                            {formatVisitDate(editMemory.visit.start_date)} –{' '}
                            {formatVisitDate(editMemory.visit.end_date)}
                            {editMemory.visit.visitingPartner?.displayName
                              ? ` · ${editMemory.visit.visitingPartner.displayName}`
                              : ''}
                          </p>
                        ) : null}
                        {editMemory.dateIdea ? (
                          <p className="memory-detail__meta">{editMemory.dateIdea.category}</p>
                        ) : null}
                      </div>
                      <div className="memory-detail__header-actions">
                        {editMemory.images.length > 0 ? (
                          <button
                            type="button"
                            className="memory-detail__close"
                            onClick={() => openAlbumViewer(editMemory.id)}
                          >
                            View photos
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="memory-detail__close"
                          onClick={() => setEditMemoryId(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="memory-detail__fields">
                      <div className="memory-detail__field">
                        <label htmlFor="memory-title">Title</label>
                        <input
                          id="memory-title"
                          value={titleDraft}
                          onChange={(event) => setTitleDraft(event.target.value)}
                          placeholder="Optional title for this album"
                          maxLength={120}
                        />
                      </div>
                      <div className="memory-detail__field">
                        <label htmlFor="memory-note">Note</label>
                        <textarea
                          id="memory-note"
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          placeholder="What made this special?"
                          maxLength={2000}
                          rows={3}
                        />
                      </div>
                      <button
                        type="button"
                        className="memory-detail__save"
                        onClick={saveMemoryMeta}
                        disabled={savingMeta}
                      >
                        {savingMeta ? 'Saving…' : 'Save details'}
                      </button>
                    </div>

                    <div className="memory-upload">
                      <label className="memory-upload__btn" htmlFor="memory-images">
                        {uploading ? 'Uploading…' : 'Upload photos'}
                      </label>
                      <input
                        id="memory-images"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        disabled={uploading}
                        onChange={handleUpload}
                        className="memory-upload__input"
                      />
                      <p className="memory-upload__hint">
                        JPEG, PNG, WebP, or GIF · up to 8 files · 5MB each
                      </p>
                    </div>

                    {editMemory.images.length === 0 ? (
                      <p className="dashboard-page__text" style={{ margin: 0 }}>
                        No photos yet. Upload your first snapshot from this moment.
                      </p>
                    ) : (
                      <div className="memory-gallery">
                        {editMemory.images.map((image) => (
                          <figure key={image.id} className="memory-gallery__item">
                            <img
                              src={mediaUrl(image.url)}
                              alt={image.caption || image.originalName || 'Memory photo'}
                              className="memory-gallery__img"
                            />
                            <button
                              type="button"
                              className="memory-gallery__delete"
                              onClick={() => handleDeleteImage(image.id)}
                              disabled={deletingImageId === image.id}
                            >
                              {deletingImageId === image.id ? 'Removing…' : 'Remove'}
                            </button>
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {viewMemory ? (
        <div
          className="memory-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-modal-title"
          onClick={() => setViewMemoryId(null)}
        >
          <div
            className="memory-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="memory-modal__header">
              <div>
                <span className="memory-detail__badge">Album</span>
                <h2 id="memory-modal-title" className="memory-modal__title">
                  {memoryHeading(viewMemory)}
                </h2>
                {viewMemory.note ? (
                  <p className="memory-modal__note">{viewMemory.note}</p>
                ) : null}
              </div>
              <div className="memory-detail__header-actions">
                <button
                  type="button"
                  className="memory-detail__close"
                  onClick={() => openAlbumEditor(viewMemory.id)}
                >
                  Manage
                </button>
                <button
                  type="button"
                  className="memory-detail__close"
                  onClick={() => setViewMemoryId(null)}
                >
                  Close
                </button>
              </div>
            </div>

            {viewMemory.images.length === 0 ? (
              <p className="dashboard-page__text" style={{ margin: 0 }}>
                No photos in this album yet.
              </p>
            ) : (
              <div className="memory-modal__gallery">
                {viewMemory.images.map((image) => (
                  <img
                    key={image.id}
                    src={mediaUrl(image.url)}
                    alt={image.caption || image.originalName || 'Memory photo'}
                    className="memory-modal__img"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
