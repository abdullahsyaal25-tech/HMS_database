import axios from 'axios';

// Set up Axios defaults for CSRF tokens
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Add CSRF token to requests if available
if (window.Laravel && window.Laravel.csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = window.Laravel.csrfToken;
} else {
    // Try to get CSRF token from meta tag
    const csrfToken = document.head.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (csrfToken) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
    }
}

// @ts-expect-error: Assigning axios to window.axios for compatibility
window.axios = axios;