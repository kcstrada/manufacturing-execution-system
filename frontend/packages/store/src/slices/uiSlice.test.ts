import uiReducer, {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  setLocale,
  setIsMobile,
} from './uiSlice'
import { UIState } from '../types'

describe('uiSlice', () => {
  const initialState: UIState = {
    sidebarOpen: true,
    theme: 'light',
    locale: 'en',
    isMobile: false,
  }

  it('should return the initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle toggleSidebar', () => {
    const actual = uiReducer(initialState, toggleSidebar())
    expect(actual.sidebarOpen).toBe(false)

    const toggled = uiReducer(actual, toggleSidebar())
    expect(toggled.sidebarOpen).toBe(true)
  })

  it('should handle setSidebarOpen', () => {
    const actual = uiReducer(initialState, setSidebarOpen(false))
    expect(actual.sidebarOpen).toBe(false)

    const opened = uiReducer(actual, setSidebarOpen(true))
    expect(opened.sidebarOpen).toBe(true)
  })

  it('should handle setTheme', () => {
    const actual = uiReducer(initialState, setTheme('dark'))
    expect(actual.theme).toBe('dark')

    const light = uiReducer(actual, setTheme('light'))
    expect(light.theme).toBe('light')
  })

  it('should handle toggleTheme', () => {
    const actual = uiReducer(initialState, toggleTheme())
    expect(actual.theme).toBe('dark')

    const toggled = uiReducer(actual, toggleTheme())
    expect(toggled.theme).toBe('light')
  })

  it('should handle setLocale', () => {
    const actual = uiReducer(initialState, setLocale('es'))
    expect(actual.locale).toBe('es')
  })

  it('should handle setIsMobile and close sidebar on mobile', () => {
    const actual = uiReducer(initialState, setIsMobile(true))
    expect(actual.isMobile).toBe(true)
    expect(actual.sidebarOpen).toBe(false)
  })

  it('should handle setIsMobile for desktop', () => {
    const mobileState: UIState = {
      ...initialState,
      isMobile: true,
      sidebarOpen: false,
    }
    const actual = uiReducer(mobileState, setIsMobile(false))
    expect(actual.isMobile).toBe(false)
    expect(actual.sidebarOpen).toBe(false)
  })
})