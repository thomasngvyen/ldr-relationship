import { useNavigate } from 'react-router-dom'
import StaggeredMenu from './StaggeredMenu'
import { useAuth } from '../context/AuthContext'

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

  const authedMenuItems = [
    { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/dashboard' },
    { label: 'Visits', ariaLabel: 'View and plan visits', link: '/visits' },
    { label: 'Pair', ariaLabel: 'Connect with your partner', link: '/pair' },
    {
      label: 'Log out',
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
        displayItemNumbering
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen
        colors={['#E8B4F8', '#aa3bff']}
        accentColor="#aa3bff"
      />
      <main className="relative z-0 px-6 pb-12 pt-24">{children}</main>
    </div>
  )
}
