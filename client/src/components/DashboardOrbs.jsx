import { useMediaQuery } from '../hooks/useMediaQuery'
import { MQ } from '../constants/breakpoints'

/**
 * Soft background orbs for pink dashboard pages.
 * Hidden on small screens and when the user prefers reduced motion.
 */
export default function DashboardOrbs() {
  const isMobile = useMediaQuery(MQ.mobile)
  const reduceMotion = useMediaQuery(MQ.reducedMotion)

  if (isMobile || reduceMotion) return null

  return (
    <>
      <div className="dashboard-page__orb dashboard-page__orb--one" aria-hidden="true" />
      <div className="dashboard-page__orb dashboard-page__orb--two" aria-hidden="true" />
    </>
  )
}
