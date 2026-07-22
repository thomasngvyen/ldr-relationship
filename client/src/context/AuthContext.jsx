import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { client } from '../api/client';
import { isTokenExpired, msUntilExpiry } from '../lib/jwt';

/**
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user
 * @property {boolean} loading
 * @property {(credentials: { email: string, password: string }) => Promise<Object>} login
 * @property {(credentials: { displayName?: string, email: string, password: string }) => Promise<Object>} register
 * @property {() => void} logout
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/** @returns {AuthContextValue} */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactNode}
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | null>} */
    const expiryTimerRef = useRef(null);

    const clearExpiryTimer = useCallback(() => {
        if (expiryTimerRef.current !== null) {
            clearTimeout(expiryTimerRef.current);
            expiryTimerRef.current = null;
        }
    }, []);

    const logout = useCallback(() => {
        clearExpiryTimer();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, [clearExpiryTimer]);

    const scheduleLogout = useCallback(
        (token) => {
            clearExpiryTimer();

            const remaining = msUntilExpiry(token);
            if (remaining === 0) {
                logout();
                return;
            }

            // setTimeout max delay is ~24.8 days; clamp just in case of long-lived tokens
            const delay = Math.min(remaining, 2_147_483_647);
            expiryTimerRef.current = setTimeout(() => {
                logout();
            }, delay);
        },
        [clearExpiryTimer, logout],
    );

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser && !isTokenExpired(token)) {
            setUser(JSON.parse(savedUser));
            scheduleLogout(token);
        } else if (token || savedUser) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        setLoading(false);

        return () => {
            clearExpiryTimer();
        };
    }, [clearExpiryTimer, scheduleLogout]);

    // Log out when the API reports an expired/invalid token
    useEffect(() => {
        /**
         * @param {Event} event
         */
        function handleUnauthorized(event) {
            if (!(event instanceof CustomEvent)) return;
            logout();
        }

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [logout]);

    /**
     * @param {Object} credentials
     * @param {string} credentials.email
     * @param {string} credentials.password
     * @returns {Promise<Object>}
     */
    const login = async (credentials) => {
        const data = await client('/api/auth/login', { body: credentials });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        scheduleLogout(data.token);
        return data.user;
    };

    /**
     * @param {Object} credentials
     * @param {string} [credentials.displayName]
     * @param {string} credentials.email
     * @param {string} credentials.password
     * @returns {Promise<Object>}
     */
    const register = async (credentials) => {
        const data = await client('/api/auth/register', { body: credentials });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        scheduleLogout(data.token);
        return data.user;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
