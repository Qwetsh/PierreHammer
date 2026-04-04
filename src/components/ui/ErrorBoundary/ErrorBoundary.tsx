import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <h1 className="text-xl font-bold mb-2">Quelque chose s'est mal passé</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            L'application a rencontré une erreur inattendue.
          </p>
          <button
            className="px-4 py-2 rounded-lg font-medium text-sm border-none cursor-pointer min-h-[44px]"
            style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
            onClick={() => {
              this.setState({ hasError: false })
              window.location.href = '/'
            }}
          >
            Recharger l'application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
