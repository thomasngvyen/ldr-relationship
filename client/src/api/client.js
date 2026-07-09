const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const client = async (endpoint, { body, ...customConfig } = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers,
    }
    if (body) {
        config.body = JSON.stringify(body);
    }
    try{
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};