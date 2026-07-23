import { useNavigate } from 'react-router-dom'
import StaggeredMenu from './StaggeredMenu'
import { useAuth } from '../context/AuthContext'
import { MQ } from '../constants/breakpoints'
import { useMediaQuery } from '../hooks/useMediaQuery'

const publicMenuItems = [
  { label: 'Login', ariaLabel: 'Go to login page', link: '/login' },
  { label: 'Register', ariaLabel: 'Create an account', link: '/register' },
]

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactNode}
 */
export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(MQ.mobile)
  const isCompactMenu = useMediaQuery(MQ.menuCollapse)

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
        displaySocials={false}
        displayItemNumbering={!isCompactMenu}
        menuButtonColor="#fff"
        openMenuButtonColor={isCompactMenu ? '#1a1a1a' : '#fff'}
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
