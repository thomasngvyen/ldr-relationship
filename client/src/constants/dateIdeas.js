export const DATE_IDEA_CATEGORIES = [
  'OUTDOOR',
  'INDOOR',
  'ACTIVE',
  'CASUAL',
  'ROMANTIC',
  'ADVENTUROUS',
  'COZY',
]

/** @type {Record<string, string>} */
export const CATEGORY_LABELS = {
  OUTDOOR: 'Outdoor',
  INDOOR: 'Indoor',
  ACTIVE: 'Active',
  CASUAL: 'Casual',
  ROMANTIC: 'Romantic',
  ADVENTUROUS: 'Adventurous',
  COZY: 'Cozy',
}

/** Board columns mapped from the DateIdeaStatus enum */
export const STATUS_COLUMNS = [
  { key: 'IDEA', label: 'Ideas', blurb: 'Everything you two have dreamed up' },
  { key: 'SELECTED', label: 'Planned', blurb: 'Picked for an upcoming visit' },
  { key: 'COMPLETED', label: 'Done', blurb: 'Memories you already made' },
]

/**
 * @param {string} status
 * @returns {'IDEA' | 'SELECTED' | 'COMPLETED'}
 */
export function statusToColumn(status) {
  if (status === 'SELECTED') return 'SELECTED'
  if (status === 'COMPLETED') return 'COMPLETED'
  return 'IDEA'
}

/**
 * @param {string} category
 * @returns {string}
 */
export function formatCategoryLabel(category) {
  return CATEGORY_LABELS[category] ?? category.toLowerCase()
}
