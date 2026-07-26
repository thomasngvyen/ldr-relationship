const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const client = async (endpoint, { body, ...customConfig } = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers,
    };
    if (body) {
        config.body = JSON.stringify(body);
    }
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401 && !endpoint.startsWith('/api/auth/')) {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            const validationMessage = formatValidationErrors(data.errors);
            throw new Error(data.error ?? validationMessage ?? 'Request failed');
        }
        return data;
    } catch (error) {
        console.error('Error:', error);
        if (error instanceof TypeError) {
            throw new Error(
                'Cannot reach the server. Is it running on port 3001?',
            );
        }
        throw error;
    }
};

/**
 * @param {unknown} errors
 * @returns {string | null}
 */
function formatValidationErrors(errors) {
    if (!errors || typeof errors !== 'object') return null;

    const fieldErrors =
        'fieldErrors' in errors && errors.fieldErrors && typeof errors.fieldErrors === 'object'
            ? errors.fieldErrors
            : null;

    if (fieldErrors) {
        const messages = Object.values(fieldErrors)
            .flat()
            .filter((value) => typeof value === 'string');
        if (messages.length > 0) return messages.join(' ');
    }

    if ('formErrors' in errors && Array.isArray(errors.formErrors) && errors.formErrors.length > 0) {
        return errors.formErrors.filter((value) => typeof value === 'string').join(' ');
    }

    return null;
}
