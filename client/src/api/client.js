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
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error ?? 'Request failed');
        }
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};