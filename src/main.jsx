import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Monkey-patch for elementFromPoint to prevent crashes from browser extensions (like Project Naptha)
// that might provide non-finite coordinates.
const _originalElementFromPoint = document.elementFromPoint.bind(document);
document.elementFromPoint = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        // Silently fail or warn to prevent extension crash from bubbling up
        return null;
    }
    return _originalElementFromPoint(x, y);
};

const _originalElementsFromPoint = document.elementsFromPoint.bind(document);
document.elementsFromPoint = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return [];
    }
    return _originalElementsFromPoint(x, y);
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
