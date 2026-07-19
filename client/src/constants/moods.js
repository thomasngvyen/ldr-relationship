export const MOODS = [
  'HAPPY',
  'SAD',
  'ANGRY',
  'EXCITED',
  'CONFUSED',
  'BORED',
  'TIRED',
  'SICK',
  'STRESSED',
  'RELAXED',
  'HORNY',
  'SLEEPY',
]

/** @type {Record<string, { label: string, blurb: string }>} */
export const MOOD_META = {
  HAPPY: { label: 'Happy', blurb: 'Feeling bright today' },
  SAD: { label: 'Sad', blurb: 'Could use a soft word' },
  ANGRY: { label: 'Angry', blurb: 'Need to cool down' },
  EXCITED: { label: 'Excited', blurb: 'Something good is coming' },
  CONFUSED: { label: 'Confused', blurb: 'Need a little clarity' },
  BORED: { label: 'Bored', blurb: 'Looking for a spark' },
  TIRED: { label: 'Tired', blurb: 'Running on empty' },
  SICK: { label: 'Sick', blurb: 'Not feeling well' },
  STRESSED: { label: 'Stressed', blurb: 'A lot on your mind' },
  RELAXED: { label: 'Relaxed', blurb: 'Settled and calm' },
  HORNY: { label: 'Missing touch', blurb: 'Thinking about you' },
  SLEEPY: { label: 'Sleepy', blurb: 'Ready to drift off' },
}

/**
 * @param {string} mood
 * @returns {string}
 */
export function formatMoodLabel(mood) {
  return MOOD_META[mood]?.label ?? mood.toLowerCase().replaceAll('_', ' ')
}
