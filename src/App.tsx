import { DisplayProvider } from './os/DisplayContext'
import { OsProvider } from './os/OsContext'
import { ShellRouter } from './shells/ShellRouter'

export function App() {
  return (
    <DisplayProvider>
      <OsProvider>
        <ShellRouter />
      </OsProvider>
    </DisplayProvider>
  )
}
