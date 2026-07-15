'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Erro ao abrir wizard</h3>
            <pre className="text-xs text-red-500 bg-red-50 p-3 rounded overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button onClick={() => this.setState({ hasError: false, error: undefined })}
              className="btn-primary text-xs px-3 py-1.5 mt-3">
              Fechar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
