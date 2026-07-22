import { useState } from 'react'
import { DATE_IDEA_CATEGORIES, formatCategoryLabel } from '../constants/dateIdeas'
import ErrorBanner from './ErrorBanner'
import './DateIdeaComponents.css'

/**
 * @param {Object} props
 * @param {{ title?: string, description?: string, category?: string } | null} [props.initialValues]
 * @param {(values: { title: string, description: string, category: string }) => void | Promise<void>} props.onSubmit
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.submitting]
 */
export default function DateIdeaForm({
  initialValues = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [category, setCategory] = useState(initialValues?.category ?? '')
  const [error, setError] = useState('')

  const isEditing = Boolean(initialValues)

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!title.trim() || !description.trim() || !category) {
      setError('Please fill in a title, description, and category.')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this idea.')
    }
  }

  return (
    <form className="idea-form" onSubmit={handleSubmit}>
      <div className="idea-form__header">
        <span className="idea-form__badge">Date ideas</span>
        <h3 className="idea-form__title">
          {isEditing ? 'Update this idea' : 'Dream up a date'}
        </h3>
        <p className="idea-form__subtitle">
          Add something you two could do together. You can both vote on your favorites.
        </p>
      </div>

      {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

      <div className="idea-form__field">
        <label htmlFor="idea-title">Title</label>
        <input
          id="idea-title"
          type="text"
          name="title"
          value={title}
          maxLength={100}
          placeholder="Picnic under the stars"
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      <div className="idea-form__field">
        <label htmlFor="idea-description">Description</label>
        <textarea
          id="idea-description"
          name="description"
          value={description}
          maxLength={1000}
          placeholder="Pack snacks, bring a blanket, and find a spot away from the city lights..."
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </div>

      <div className="idea-form__field">
        <label htmlFor="idea-category">Category</label>
        <select
          id="idea-category"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        >
          <option value="" disabled>
            Choose a category
          </option>
          {DATE_IDEA_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {formatCategoryLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="idea-form__actions">
        {onCancel ? (
          <button
            type="button"
            className="idea-form__btn idea-form__btn--ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
        <button type="submit" className="idea-form__btn idea-form__btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Update idea' : 'Add idea'}
        </button>
      </div>
    </form>
  )
}
