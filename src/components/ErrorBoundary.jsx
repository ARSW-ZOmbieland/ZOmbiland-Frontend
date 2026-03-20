import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#8b0000', color: 'white', height: '100vh', overflow: 'auto' }}>
          <h2>💥 Zombieland React Crash! 💥</h2>
          <p>Algo falló terriblemente durante el copiado al canvas de React.</p>
          <pre style={{ backgroundColor: '#000', padding: '10px', color: '#ff4d4d', whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Ver Component Stack</summary>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
