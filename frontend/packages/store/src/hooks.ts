import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useAuth = () => useAppSelector((state) => state.auth)
export const useUI = () => useAppSelector((state) => state.ui)
export const useNotifications = () => useAppSelector((state) => state.notifications)