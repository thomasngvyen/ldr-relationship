import { useLocation, useNavigate } from 'react-router-dom'
import StaggeredMenu from './StaggeredMenu'
import { useAuth } from '../context/AuthContext'
import { MQ } from '../constants/breakpoints'
import { useMediaQuery } from '../hooks/useMediaQuery'

const publicMenuItems = [
  { label: 'Login', ariaLabel: 'Go to login page', link: '/login' },
  { label: 'Register', ariaLabel: 'Create an account', link: '/register' },
]

/** Auth-style pages sit on the dark layout chrome around the card. */
const DARK_CHROME_ROUTES = new Set(['/login', '/register', '/pair'])

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactNode}
 */
export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isMobile = useMediaQuery(MQ.mobile)
  const isCompactMenu = useMediaQuery(MQ.menuCollapse)
  const isDarkChrome = DARK_CHROME_ROUTES.has(pathname)

  const authedMenuItems = [
    { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/dashboard' },
    { label: 'Visits', ariaLabel: 'View and plan visits', link: '/visits' },
    { label: 'Moods', ariaLabel: 'Open mood messages', link: '/moods' },
    { label: 'Messages', ariaLabel: 'Manage mood message library', link: '/messages/manage' },
    {
      label: isMobile ? 'Dates' : 'Date ideas',
      ariaLabel: 'Browse and vote on date ideas',
      link: '/date-ideas',
    },
    { label: 'Memories', ariaLabel: 'Browse shared memories and photos', link: '/memories' },
    { label: 'Feelings', ariaLabel: 'Share how you are feeling', link: '/feelings' },
    { label: 'Pair', ariaLabel: 'Connect with your partner', link: '/pair' },
    {
      label: isMobile ? 'Logout' : 'Log out',
      ariaLabel: 'Log out of your account',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const menuItems = user ? authedMenuItems : publicMenuItems

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        logoLink={user ? '/dashboard' : '/login'}
        logoTextColor={isDarkChrome ? '#ffffff' : '#831843'}
        displaySocials={false}
        displayItemNumbering={!isCompactMenu}
        menuButtonColor={isDarkChrome ? '#ffffff' : '#831843'}
        openMenuButtonColor="#831843"
        changeMenuColorOnOpen
        colors={['#f9a8d4', '#f472b6']}
        accentColor="#ec4899"
      />
      <main className="relative z-0 px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24">
        {children}
      </main>
    </div>
  )
}
