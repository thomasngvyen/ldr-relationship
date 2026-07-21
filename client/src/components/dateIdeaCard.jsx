import { formatCategoryLabel } from '../constants/dateIdeas'
import './DateIdeaComponents.css'

/**
 * @typedef {Object} DateIdea
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {'IDEA' | 'VOTED' | 'SELECTED' | 'COMPLETED'} status
 * @property {number} voteCount
 * @property {boolean} votedByCurrentUser
 * @property {{ id: string, displayName: string } | undefined} [user]
 */

/**
 * @param {Object} props
 * @param {DateIdea} props.idea
 * @param {(idea: DateIdea) => void} [props.onVote]
 * @param {(idea: DateIdea) => void} [props.onEdit]
 * @param {(idea: DateIdea) => void} [props.onDelete]
 * @param {(idea: DateIdea, status: string) => void} [props.onStatusChange]
 * @param {boolean} [props.voting]
 * @param {boolean} [props.deleting]
 * @param {boolean} [props.updating]
 */
export default function DateIdeaCard({
  idea,
  onVote,
  onEdit,
  onDelete,
  onStatusChange,
  voting = false,
  deleting = false,
  updating = false,
}) {
  const isCompleted = idea.status === 'COMPLETED'
  const isSelected = idea.status === 'SELECTED'

  return (
    <article className={`idea-card${isCompleted ? ' idea-card--completed' : ''}`}>
      <div className="idea-card__top">
        <span className="idea-card__badge">{formatCategoryLabel(idea.category)}</span>
        {onVote ? (
          <button
            type="button"
            className={`idea-card__vote${idea.votedByCurrentUser ? ' is-voted' : ''}`}
            onClick={() => onVote(idea)}
            disabled={voting}
            aria-pressed={idea.votedByCurrentUser}
            aria-label={idea.votedByCurrentUser ? 'Remove your vote' : 'Vote for this idea'}
          >
            {idea.votedByCurrentUser ? '♥' : '♡'} {idea.voteCount}
          </button>
        ) : null}
      </div>

      <h3 className="idea-card__title">{idea.title}</h3>
      <p className="idea-card__description">{idea.description}</p>

      {idea.user?.displayName ? (
        <p className="idea-card__meta">Added by {idea.user.displayName}</p>
      ) : null}

      {(onStatusChange || onEdit || onDelete) && (
        <div className="idea-card__actions">
          {onStatusChange && !isCompleted ? (
            <button
              type="button"
              className="idea-card__btn idea-card__btn--primary"
              onClick={() => onStatusChange(idea, isSelected ? 'COMPLETED' : 'SELECTED')}
              disabled={updating}
            >
              {updating ? 'Saving…' : isSelected ? 'Mark done' : 'Plan it'}
            </button>
          ) : null}
          {onStatusChange && (isSelected || isCompleted) ? (
            <button
              type="button"
              className="idea-card__btn idea-card__btn--ghost"
              onClick={() => onStatusChange(idea, 'IDEA')}
              disabled={updating}
            >
              Back to ideas
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              className="idea-card__btn idea-card__btn--ghost"
              onClick={() => onEdit(idea)}
              disabled={updating || deleting}
            >
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="idea-card__btn idea-card__btn--danger"
              onClick={() => onDelete(idea)}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}
