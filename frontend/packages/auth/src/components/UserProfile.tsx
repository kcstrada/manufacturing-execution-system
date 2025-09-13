import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface UserProfileProps {
  showAvatar?: boolean
  showRoles?: boolean
  showTenant?: boolean
  className?: string
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg'
  layout?: 'horizontal' | 'vertical'
}

export const UserProfile: React.FC<UserProfileProps> = ({
  showAvatar = true,
  showRoles = false,
  showTenant = false,
  className = '',
  avatarSize = 'md',
  layout = 'horizontal',
}) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  const avatarSizeClass = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[avatarSize]

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.username.substring(0, 2).toUpperCase()

  const layoutClass = layout === 'horizontal' 
    ? 'flex items-center gap-3'
    : 'flex flex-col items-center text-center gap-2'

  return (
    <div className={`${layoutClass} ${className}`}>
      {showAvatar && (
        <div className="avatar placeholder">
          <div className={`bg-primary text-primary-content rounded-full ${avatarSizeClass}`}>
            <span className="text-sm font-medium">{initials}</span>
          </div>
        </div>
      )}
      
      <div>
        <div className="font-semibold">{displayName}</div>
        <div className="text-sm text-base-content/70">{user.email}</div>
        
        {showTenant && user.tenantId && (
          <div className="text-xs text-base-content/60 mt-1">
            Tenant: {user.tenantId}
          </div>
        )}
        
        {showRoles && user.roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.roles.map(role => (
              <span
                key={role}
                className="badge badge-sm badge-outline"
              >
                {role}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const UserAvatar: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  const sizeClass = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }[size]

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.username.substring(0, 2).toUpperCase()

  return (
    <div className={`avatar placeholder ${className}`}>
      <div className={`bg-primary text-primary-content rounded-full ${sizeClass}`}>
        <span>{initials}</span>
      </div>
    </div>
  )
}