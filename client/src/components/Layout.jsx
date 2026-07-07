import StaggeredMenu from './StaggeredMenu'
import reactLogo from '../assets/react.svg'

const menuItems = [
  { label: 'Login', ariaLabel: 'Go to login page', link: '/login' },
  { label: 'Register', ariaLabel: 'Create an account', link: '/register' },
  { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/dashboard' },
]

export default function Layout({ children }) {
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
        logoUrl={reactLogo}
        accentColor="#aa3bff"
      />
      <main className="relative z-0 px-6 pb-12 pt-24">{children}</main>
    </div>
  )
}
