/**
 * XMLHttpRequest Interceptor
 * 
 * Intercepts XHR requests to add tracking headers and handle
 * request/response logging for debugging purposes.
 */

/**
 * Generate a UUID for request tracking
 * Uses crypto.randomUUID when available, falls back to
 * Math.random for non-secure contexts (HTTP instead of HTTPS)
 */
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Initialize the XHR interceptor
 * Adds request ID headers to all XMLHttpRequest calls
 */
export function initXHRInterceptor() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // Generate a unique request ID for tracking
        this._requestId = generateUUID();
        this._requestMethod = method;
        this._requestUrl = url;
        
        // Call the original open method
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        // Add custom headers for request tracking
        if (this._requestId) {
            this.setRequestHeader('X-Request-ID', this._requestId);
        }
        
        // Call the original send method
        return originalSend.apply(this, arguments);
    };
}

/**
 * Get the current request ID from an XHR instance
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @returns {string|null} The request ID or null if not available
 */
export function getRequestId(xhr) {
    return xhr._requestId || null;
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined') {
    initXHRInterceptor();
}

export default {
    initXHRInterceptor,
    getRequestId,
    generateUUID
};
