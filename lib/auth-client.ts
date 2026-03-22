export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// Keys for localStorage
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const AUTH_IS_AUTHENTICATED_KEY = 'auth_is_authenticated';

/**
 * Get the current authentication state from localStorage
 */
export function getAuthState(): AuthState {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userString = localStorage.getItem(AUTH_USER_KEY);
    const isAuthenticated = localStorage.getItem(AUTH_IS_AUTHENTICATED_KEY) === 'true';

    let user: User | null = null;
    if (userString) {
      user = JSON.parse(userString);
    }

    return {
      token,
      user,
      isAuthenticated: isAuthenticated && !!token && !!user,
    };
  } catch (error) {
    console.error('Error reading auth state from localStorage:', error);
    return {
      token: null,
      user: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Set the authentication state in localStorage
 */
export function setAuthState(token: string, user: User): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_IS_AUTHENTICATED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('auth-change'));
  } catch (error) {
    console.error('Error saving auth state to localStorage:', error);
  }
}

/**
 * Clear the authentication state from localStorage
 */
export function clearAuthState(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_IS_AUTHENTICATED_KEY);
    window.dispatchEvent(new CustomEvent('auth-change'));
  } catch (error) {
    console.error('Error clearing auth state from localStorage:', error);
  }
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthState().isAuthenticated;
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  return getAuthState().user;
}

/**
 * Get the current token
 */
export function getToken(): string | null {
  return getAuthState().token;
}

/**
 * Logout the user by clearing auth state
 */
export function logout(): void {
  clearAuthState();
}