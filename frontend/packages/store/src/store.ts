import { configureStore, combineReducers, Middleware } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import notificationsReducer from './slices/notificationsSlice'
import { baseApi } from './api/baseApi'

const persistConfig = {
  key: 'mes-root',
  version: 1,
  storage,
  whitelist: ['auth', 'ui'],
  blacklist: ['notifications', 'api'],
}

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  notifications: notificationsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(action.type)
    console.info('dispatching', action)
    const result = next(action)
    console.log('next state', store.getState())
    console.groupEnd()
    return result
  }
  return next(action)
}

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(baseApi.middleware)
      .concat(loggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch