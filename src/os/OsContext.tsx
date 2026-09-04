import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { MODULES, type ModuleId } from './catalog'

type OsContextValue = {
  module: ModuleId
  setModule: (id: ModuleId) => void
  modules: typeof MODULES
}

const OsContext = createContext<OsContextValue | null>(null)

export function OsProvider({ children }: { children: ReactNode }) {
  const [module, setModule] = useState<ModuleId>('home')
  const value = useMemo(() => ({ module, setModule, modules: MODULES }), [module])
  return <OsContext.Provider value={value}>{children}</OsContext.Provider>
}

export function useOs() {
  const value = useContext(OsContext)
  if (!value) throw new Error('useOs must be used within OsProvider')
  return value
}
