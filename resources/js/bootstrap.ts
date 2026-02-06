import axios from 'axios';

// Set up Axios defaults for Sanctum
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Get CSRF token from XSRF-TOKEN cookie (encrypted by Laravel)
const xsrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

if (xsrfToken) {
    // Decode the URL-encoded token
    axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
} else {
    console.error('XSRF token cookie not found: https://laravel.com/docs/csrf#csrf-x-xsrf-token');
}

// @ts-expect-error: Assigning axios to window.axios for compatibility
window.axios = axios;