import { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../api/client';

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

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);



    /**
     * @param {Object} credentials
     * @param {string} credentials.email
     * @param {string} credentials.password
     * @returns {Promise<Object>}
     */
    const login = async (credentials) =>{
        const data = await client('/api/auth/login', { body: credentials });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    }

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
        return data.user;
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}