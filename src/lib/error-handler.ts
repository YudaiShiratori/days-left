// Production-ready error handling and logging system

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

interface ErrorLog {
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Error severity classification
export const getErrorSeverity = (error: Error): ErrorLog['severity'] => {
  const message = error.message.toLowerCase();
  
  // Critical errors that affect core functionality
  if (message.includes('localstorage') || 
      message.includes('data') || 
      message.includes('service worker')) {
    return 'critical';
  }
  
  // High severity errors that affect user experience
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('load')) {
    return 'high';
  }
  
  // Medium severity errors
  if (message.includes('validation') || 
      message.includes('format')) {
    return 'medium';
  }
  
  return 'low';
};

// Create error context
const createErrorContext = (component?: string, action?: string): ErrorContext => ({
  component,
  action,
  timestamp: Date.now(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  url: typeof window !== 'undefined' ? window.location.href : 'unknown'
});

// Log error to console and potentially external service
const logError = (errorLog: ErrorLog): void => {
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error [${errorLog.severity.toUpperCase()}]`);
    console.error('Message:', errorLog.message);
    console.error('Context:', errorLog.context);
    if (errorLog.stack) {
      console.error('Stack:', errorLog.stack);
    }
    console.groupEnd();
  }
  
  // In production, log to external service (placeholder for future implementation)
  if (process.env.NODE_ENV === 'production' && errorLog.severity === 'critical') {
    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    // This is where you would integrate with your error reporting service
    try {
      // Example: Sentry.captureException(error, { extra: errorLog.context });
      // For now, we'll store in localStorage as fallback
      const existingErrors = JSON.parse(localStorage.getItem('error-logs') || '[]');
      existingErrors.push({
        ...errorLog,
        // Truncate to prevent localStorage overflow
        stack: errorLog.stack?.substring(0, 1000)
      });
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('error-logs', JSON.stringify(existingErrors));
    } catch {
      // If localStorage fails, there's not much we can do
    }
  }
};

// Main error handler function
export const handleError = (
  error: Error,
  component?: string,
  action?: string,
  showToUser = false
): void => {
  const context = createErrorContext(component, action);
  const severity = getErrorSeverity(error);
  
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    context,
    severity
  };
  
  logError(errorLog);
  
  // Show user-friendly message for critical errors
  if (showToUser && severity === 'critical') {
    showUserErrorMessage(error.message);
  }
};

// Show user-friendly error message
const showUserErrorMessage = (message: string): void => {
  // Create a simple toast notification
  if (typeof window !== 'undefined') {
    const errorToast = document.createElement('div');
    errorToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    errorToast.textContent = `エラーが発生しました: ${message}`;
    document.body.appendChild(errorToast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorToast.parentNode) {
        errorToast.parentNode.removeChild(errorToast);
      }
    }, 5000);
  }
};

// Async error handler for promises
export const handleAsyncError = async <T>(
  asyncOperation: () => Promise<T>,
  component?: string,
  action?: string,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await asyncOperation();
  } catch (error) {
    handleError(
      error instanceof Error ? error : new Error(String(error)),
      component,
      action,
      true // Show to user for async operations
    );
    return fallbackValue;
  }
};

// Service Worker error handler
export const handleServiceWorkerError = (
  error: Error,
  action: string
): void => {
  handleError(error, 'ServiceWorker', action, false);
  
  // For service worker errors, we don't want to show intrusive messages
  // but we should log them for debugging
  console.warn('Service Worker error (non-critical):', error.message);
};

// Critical data error handler (for localStorage, user data, etc.)
export const handleDataError = (
  error: Error,
  action: string
): void => {
  handleError(error, 'DataManager', action, true);
  
  // For data errors, we should always notify the user
  console.error('Critical data error:', error.message);
};

// Error boundary helper for React components
export const createErrorBoundary = (componentName: string) => {
  return (error: Error) => {
    handleError(error, componentName, 'render', true);
  };
};

// Get stored error logs (for debugging)
export const getStoredErrorLogs = (): ErrorLog[] => {
  try {
    return JSON.parse(localStorage.getItem('error-logs') || '[]');
  } catch {
    return [];
  }
};

// Clear stored error logs
export const clearStoredErrorLogs = (): void => {
  try {
    localStorage.removeItem('error-logs');
  } catch {
    // If localStorage fails, ignore
  }
};