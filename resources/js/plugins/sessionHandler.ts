import { useEffect } from 'react';

/**
 * Inertia Session Error Handler Hook
 * 
 * Handles session_not_found and 401 Unauthorized errors gracefully
 * by redirecting to login page with return URL preserved.
 */
export function useSessionHandler() {
  useEffect(() => {
    // Check session validity on page load
    const checkSession = () => {
      const authUser = document.querySelector('[data-auth-user]');
      if (!authUser && !window.location.pathname.includes('/login')) {
        console.warn('[SessionHandler] No authenticated user found on non-login page');
      }
    };
    
    // Run check after page is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkSession);
    } else {
      checkSession();
    }
    
    // Cleanup
    return () => {
      // Inertia.js error handling is done in useApi.ts
    };
  }, []);
}

/**
 * Helper function to check if session is valid
 */
export function isSessionValid(): boolean {
  try {
    // Check if auth user exists in shared data
    const authElement = document.querySelector('[data-auth-user]');
    if (!authElement) {
      return false;
    }
    
    // Check if session cookie exists
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('laravel_session='));
    
    return !!sessionCookie;
  } catch {
    return false;
  }
}

/**
 * Helper function to get redirect URL after login
 */
export function getRedirectAfterLogin(): string | null {
  return sessionStorage.getItem('redirect_after_login');
}

/**
 * Helper function to clear redirect URL after login
 */
export function clearRedirectAfterLogin(): void {
  sessionStorage.removeItem('redirect_after_login');
}

/**
 * Force logout and redirect to login
 */
export function forceLogout(reason: string = 'session_invalid'): void {
  // Clear all session storage
  sessionStorage.clear();
  localStorage.clear();
  
  // Redirect to login with reason
  const redirectUrl = getRedirectAfterLogin();
  const loginUrl = redirectUrl 
    ? `/login?reason=${reason}&redirect=${encodeURIComponent(redirectUrl)}`
    : `/login?reason=${reason}`;
  
  window.location.href = loginUrl;
}
