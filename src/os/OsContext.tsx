import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { MODULES, type ModuleId } from './catalog'
import { INITIAL_NAVIGATION, navigationReducer } from './navigation'

type OsContextValue = {
  module: ModuleId
  setModule: (id: ModuleId) => void
  goBack: () => void
  canGoBack: boolean
  modules: typeof MODULES
}

const OsContext = createContext<OsContextValue | null>(null)

export function OsProvider({ children }: { children: ReactNode }) {
  const [navigation, dispatch] = useReducer(navigationReducer, INITIAL_NAVIGATION)
  const setModule = useCallback((id: ModuleId) => dispatch({ type: 'open', id }), [])
  const goBack = useCallback(() => dispatch({ type: 'back' }), [])
  const value = useMemo(() => ({
    module: navigation.current,
    setModule,
    goBack,
    canGoBack: navigation.backStack.length > 0,
    modules: MODULES,
  }), [navigation, setModule, goBack])
  return <OsContext.Provider value={value}>{children}</OsContext.Provider>
}

export function useOs() {
  const value = useContext(OsContext)
  if (!value) throw new Error('useOs must be used within OsProvider')
  return value
}
