import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface LogoutButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'error'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children?: React.ReactNode
  onLogoutStart?: () => void
  onLogoutComplete?: () => void
  confirmLogout?: boolean
  confirmMessage?: string
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = '',
  variant = 'ghost',
  size = 'md',
  children = 'Logout',
  onLogoutStart,
  onLogoutComplete,
  confirmLogout = false,
  confirmMessage = 'Are you sure you want to logout?',
}) => {
  const { logout, isLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    if (confirmLogout && !window.confirm(confirmMessage)) {
      return
    }

    try {
      setIsLoggingOut(true)
      if (onLogoutStart) {
        onLogoutStart()
      }
      await logout()
      if (onLogoutComplete) {
        onLogoutComplete()
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const buttonClass = `btn btn-${variant} btn-${size} ${className}`
  const isDisabled = isLoading || isLoggingOut

  return (
    <button
      className={buttonClass}
      onClick={handleLogout}
      disabled={isDisabled}
    >
      {isLoggingOut ? (
        <>
          <span className="loading loading-spinner"></span>
          Logging out...
        </>
      ) : (
        children
      )}
    </button>
  )
}