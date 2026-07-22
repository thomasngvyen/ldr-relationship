import { useEffect, useState } from 'react'
import { client } from '../api/client'
import { STATUS_COLUMNS, statusToColumn } from '../constants/dateIdeas'
import DateIdeaCard from './dateIdeaCard'
import DateIdeaForm from './dateIdeaForm'
import ErrorBanner from './ErrorBanner'
import LoadingSpinner from './LoadingSpinner'
import './DateIdeaComponents.css'

/** @typedef {import('./dateIdeaCard').DateIdea} DateIdea */

export default function DateIdeaBoard() {
  const [ideas, setIdeas] = useState(/** @type {DateIdea[]} */ ([]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(/** @type {string | null} */ (null))

  const [showForm, setShowForm] = useState(false)
  const [editingIdea, setEditingIdea] = useState(/** @type {DateIdea | null} */ (null))
  const [submitting, setSubmitting] = useState(false)

  const [votingId, setVotingId] = useState(/** @type {string | null} */ (null))
  const [updatingId, setUpdatingId] = useState(/** @type {string | null} */ (null))
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null))

  useEffect(() => {
    let cancelled = false

    async function fetchIdeas() {
      setLoading(true)
      setError(null)

      try {
        const data = await client('/api/dateIdeas')
        if (!cancelled) {
          setIdeas(Array.isArray(data.dateIdeas) ? data.dateIdeas : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load date ideas')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchIdeas()

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * @param {{ title: string, description: string, category: string }} values
   */
  async function handleSubmit(values) {
    setSubmitting(true)
    setError(null)

    try {
      if (editingIdea) {
        const data = await client(`/api/dateIdeas/${editingIdea.id}`, {
          method: 'PATCH',
          body: values,
        })
        setIdeas((prev) =>
          prev.map((idea) => (idea.id === editingIdea.id ? data.dateIdea : idea)),
        )
      } else {
        const data = await client('/api/dateIdeas', { body: values })
        setIdeas((prev) => [data.dateIdea, ...prev])
      }

      setShowForm(false)
      setEditingIdea(null)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * @param {DateIdea} idea
   */
  async function handleVote(idea) {
    setVotingId(idea.id)
    setError(null)

    try {
      const data = await client(`/api/dateIdeas/${idea.id}/vote`, { method: 'POST' })
      setIdeas((prev) =>
        prev.map((item) =>
          item.id === idea.id
            ? { ...item, voteCount: data.voteCount, votedByCurrentUser: data.voted }
            : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vote')
    } finally {
      setVotingId(null)
    }
  }

  /**
   * @param {DateIdea} idea
   * @param {string} status
   */
  async function handleStatusChange(idea, status) {
    setUpdatingId(idea.id)
    setError(null)

    try {
      const data = await client(`/api/dateIdeas/${idea.id}`, {
        method: 'PATCH',
        body: { status },
      })
      setIdeas((prev) =>
        prev.map((item) => (item.id === idea.id ? data.dateIdea : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move this idea')
    } finally {
      setUpdatingId(null)
    }
  }

  /**
   * @param {DateIdea} idea
   */
  async function handleDelete(idea) {
    setDeletingId(idea.id)
    setError(null)

    try {
      await client(`/api/dateIdeas/${idea.id}`, { method: 'DELETE' })
      setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
      if (editingIdea?.id === idea.id) {
        setEditingIdea(null)
        setShowForm(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete this idea')
    } finally {
      setDeletingId(null)
    }
  }

  /**
   * @param {DateIdea} idea
   */
  function startEdit(idea) {
    setEditingIdea(idea)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingIdea(null)
  }

  if (loading) {
    return <LoadingSpinner label="Loading your date ideas..." />
  }

  return (
    <div className="dashboard-page__stack">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {showForm ? (
        <DateIdeaForm
          key={editingIdea?.id ?? 'new'}
          initialValues={editingIdea}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      ) : (
        <button
          type="button"
          className="idea-form__btn idea-form__btn--primary"
          onClick={() => setShowForm(true)}
        >
          Add a date idea
        </button>
      )}

      <div className="idea-board">
        {STATUS_COLUMNS.map((column) => {
          const columnIdeas = ideas.filter(
            (idea) => statusToColumn(idea.status) === column.key,
          )

          return (
            <section key={column.key} className="idea-board__column">
              <header className="idea-board__heading">
                <p className="idea-board__label">
                  {column.label}
                  <span className="idea-board__count">{columnIdeas.length}</span>
                </p>
                <p className="idea-board__blurb">{column.blurb}</p>
              </header>

              {columnIdeas.length === 0 ? (
                <p className="idea-board__empty">Nothing here yet</p>
              ) : (
                columnIdeas.map((idea) => (
                  <DateIdeaCard
                    key={idea.id}
                    idea={idea}
                    onVote={handleVote}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    voting={votingId === idea.id}
                    updating={updatingId === idea.id}
                    deleting={deletingId === idea.id}
                  />
                ))
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
