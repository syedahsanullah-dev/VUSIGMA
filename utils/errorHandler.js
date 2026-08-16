/**
 * Centralized secure error handler.
 * Logs full error internally, returns only a safe generic message to the client.
 * Never expose error.message, stack traces, or DB internals publicly.
 */
export function internalError(res, error, context = '') {
  console.error(`[SERVER ERROR]${context ? ' ' + context : ''}:`, error);
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: error.message, details: error.errors || null });
  }
  return res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
}
