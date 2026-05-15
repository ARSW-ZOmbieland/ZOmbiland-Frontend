import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Hardened Monkey-patch for elementFromPoint to prevent crashes from browser extensions (like Project Naptha)
// that might provide non-finite coordinates.
(function() {
    const _originalElementFromPoint = document.elementFromPoint.bind(document);
    const _originalElementsFromPoint = document.elementsFromPoint.bind(document);

    const safeElementFromPoint = (x, y) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        try {
            return _originalElementFromPoint(x, y);
        } catch (e) {
            return null;
        }
    };

    const safeElementsFromPoint = (x, y) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
        try {
            return _originalElementsFromPoint(x, y);
        } catch (e) {
            return [];
        }
    };

    Object.defineProperty(document, 'elementFromPoint', { value: safeElementFromPoint, configurable: true });
    Object.defineProperty(document, 'elementsFromPoint', { value: safeElementsFromPoint, configurable: true });
    
    // Also patch the prototype to catch calls from other contexts
    if (window.Document && Document.prototype) {
        Document.prototype.elementFromPoint = safeElementFromPoint;
        Document.prototype.elementsFromPoint = safeElementsFromPoint;
    }
})();


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
