import notificationsReducer, {
  addNotification,
  removeNotification,
  clearNotifications,
  setMaxNotifications,
} from './notificationsSlice'
import { NotificationsState } from '../types'

describe('notificationsSlice', () => {
  const initialState: NotificationsState = {
    notifications: [],
    maxNotifications: 5,
  }

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1000000)
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return the initial state', () => {
    expect(notificationsReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle addNotification', () => {
    const actual = notificationsReducer(
      initialState,
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
        duration: 3000,
      })
    )

    expect(actual.notifications).toHaveLength(1)
    expect(actual.notifications[0]).toEqual({
      id: 'notification-1000000-0.5',
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
      duration: 3000,
      timestamp: 1000000,
    })
  })

  it('should add notification with default duration', () => {
    const actual = notificationsReducer(
      initialState,
      addNotification({
        type: 'info',
        title: 'Info',
      })
    )

    expect(actual.notifications[0].duration).toBe(5000)
  })

  it('should limit notifications to maxNotifications', () => {
    const stateWithNotifications: NotificationsState = {
      notifications: Array.from({ length: 5 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'info',
        title: `Notification ${i}`,
        timestamp: i,
      })),
      maxNotifications: 5,
    }

    const actual = notificationsReducer(
      stateWithNotifications,
      addNotification({
        type: 'success',
        title: 'New notification',
      })
    )

    expect(actual.notifications).toHaveLength(5)
    expect(actual.notifications[0].title).toBe('New notification')
    expect(actual.notifications[4].title).toBe('Notification 3')
  })

  it('should handle removeNotification', () => {
    const stateWithNotifications: NotificationsState = {
      notifications: [
        {
          id: 'notification-1',
          type: 'info',
          title: 'First',
          timestamp: 1,
        },
        {
          id: 'notification-2',
          type: 'success',
          title: 'Second',
          timestamp: 2,
        },
      ],
      maxNotifications: 5,
    }

    const actual = notificationsReducer(
      stateWithNotifications,
      removeNotification('notification-1')
    )

    expect(actual.notifications).toHaveLength(1)
    expect(actual.notifications[0].id).toBe('notification-2')
  })

  it('should handle clearNotifications', () => {
    const stateWithNotifications: NotificationsState = {
      notifications: [
        {
          id: 'notification-1',
          type: 'info',
          title: 'First',
          timestamp: 1,
        },
        {
          id: 'notification-2',
          type: 'success',
          title: 'Second',
          timestamp: 2,
        },
      ],
      maxNotifications: 5,
    }

    const actual = notificationsReducer(stateWithNotifications, clearNotifications())
    expect(actual.notifications).toHaveLength(0)
  })

  it('should handle setMaxNotifications', () => {
    const actual = notificationsReducer(initialState, setMaxNotifications(10))
    expect(actual.maxNotifications).toBe(10)
  })

  it('should truncate notifications when reducing maxNotifications', () => {
    const stateWithNotifications: NotificationsState = {
      notifications: Array.from({ length: 5 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'info',
        title: `Notification ${i}`,
        timestamp: i,
      })),
      maxNotifications: 5,
    }

    const actual = notificationsReducer(
      stateWithNotifications,
      setMaxNotifications(3)
    )

    expect(actual.maxNotifications).toBe(3)
    expect(actual.notifications).toHaveLength(3)
    expect(actual.notifications[0].title).toBe('Notification 0')
    expect(actual.notifications[2].title).toBe('Notification 2')
  })
})