const SB_API_BASE_URL = '/api';
let sbCsrfTokenPromise;

async function sbGetCsrfToken() {
    if (!sbCsrfTokenPromise) {
        sbCsrfTokenPromise = fetch(`${SB_API_BASE_URL}/csrf-token`, { credentials: 'same-origin' })
            .then(async response => {
                if (!response.ok) throw new Error('Unable to prepare a secure request. Refresh the page and try again.');
                const result = await response.json();
                return result.csrfToken;
            })
            .catch(error => {
                sbCsrfTokenPromise = null;
                throw error;
            });
    }
    return sbCsrfTokenPromise;
}

async function sbApi(path, options = {}) {
    let response;
    const method = options.method || 'GET';
    try {
        const headers = options.body ? { 'Content-Type': 'application/json' } : {};
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            headers['X-CSRF-Token'] = await sbGetCsrfToken();
        }
        response = await fetch(`${SB_API_BASE_URL}${path}`, {
            method,
            credentials: 'same-origin',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
    } catch (error) {
        throw new Error('Cannot reach SkillBridge. Start the server with `npm run dev` and try again.');
    }

    let data;
    try {
        data = response.status === 204 ? {} : await response.json();
    } catch (error) {
        throw new Error('The server returned an invalid response. Please try again.');
    }
    if (!response.ok) {
        const error = new Error(data.error || 'The server could not complete this request.');
        error.status = response.status;
        error.code = data.code;
        if (['CSRF_TOKEN_INVALID', 'CSRF_TOKEN_REQUIRED'].includes(error.code) && !options.csrfRetried) {
            sbCsrfTokenPromise = null;
            return sbApi(path, { ...options, csrfRetried: true });
        }
        throw error;
    }
    return data;
}
