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
] as const;

export type Mood = (typeof MOODS)[number];