import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface LoginButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children?: React.ReactNode
  onLoginStart?: () => void
  onLoginError?: (error: Error) => void
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'md',
  children = 'Login',
  onLoginStart,
  onLoginError,
}) => {
  const { login, isLoading } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      if (onLoginStart) {
        onLoginStart()
      }
      await login()
    } catch (error) {
      console.error('Login failed:', error)
      if (onLoginError) {
        onLoginError(error as Error)
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const buttonClass = `btn btn-${variant} btn-${size} ${className}`
  const isDisabled = isLoading || isLoggingIn

  return (
    <button
      className={buttonClass}
      onClick={handleLogin}
      disabled={isDisabled}
    >
      {isLoggingIn ? (
        <>
          <span className="loading loading-spinner"></span>
          Logging in...
        </>
      ) : (
        children
      )}
    </button>
  )
}