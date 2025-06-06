import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Mock Service Worker browser setup
 * This configures a Service Worker with the given request handlers
 * for client-side API mocking during development.
 */
export const worker = setupWorker(...handlers);

/**
 * Start the MSW worker with specific options
 * @param options - Configuration options for the worker
 */
export async function startMSW(options = {}) {
  // Log when in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('[MSW] Starting mock API service worker');
  }

  // Start the worker with default or provided options
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    ...options,
  });
}
