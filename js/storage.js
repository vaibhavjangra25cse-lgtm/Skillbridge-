let sbMentorCache = [];
let sbCurrentUser = null;

function sbGetCurrentUser() {
    return sbCurrentUser;
}

function sbSetCurrentUser(user) {
    sbCurrentUser = user;
}

const sbAuthReady = (async () => {
    try {
        const { user } = await sbApi('/auth/me');
        sbSetCurrentUser(user);
        return user;
    } catch (error) {
        if (error.status === 401) {
            sbSetCurrentUser(null);
            return null;
        }
        console.error('Unable to verify the saved SkillBridge session:', error);
        return null;
    }
})();

async function sbRegisterUser(userData) {
    try {
        const { user } = await sbApi('/auth/register', { method: 'POST', body: userData });
        sbSetCurrentUser(user);
        return { ok: true, user };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

async function sbLogin(email, password) {
    try {
        const { user } = await sbApi('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        sbSetCurrentUser(user);
        return { ok: true, user };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

async function sbLogout() {
    await sbApi('/auth/logout', { method: 'POST' });
    sbSetCurrentUser(null);
}

async function sbCreateRequest({ skillId, description, mentorId = '', mentorName = '' }) {
    if (!sbGetCurrentUser()) {
        return { ok: false, error: 'Please sign in before submitting a learning request.' };
    }
    if (!skillId) return { ok: false, error: 'Choose a skill before submitting your request.' };
    if (!description || description.trim().length < 5 || description.trim().length > 2000) {
        return { ok: false, error: 'Please describe what you would like to learn (5 to 2000 characters).' };
    }
    try {
        const result = await sbApi('/requests', {
            method: 'POST',
            body: {
                skillId: String(skillId),
                message: description.trim(),
                mentorId: String(mentorId || ''),
                mentorName: mentorName.trim(),
            },
        });
        return { ok: true, request: result.request };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

async function sbGetRequests(endpoint = '/requests/my') {
    const result = await sbApi(endpoint);
    return result.requests;
}

async function sbUpdateRequestStatus(requestId, newStatus) {
    try {
        const result = await sbApi(`/requests/${encodeURIComponent(requestId)}/status`, {
            method: 'PATCH',
            body: { status: newStatus.toLowerCase() },
        });
        return { ok: true, request: result.request };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

function sbGetRequestCounts(requests = []) {
    return requests.reduce((counts, request) => {
        const status = request.status.toLowerCase();
        counts.total += 1;
        if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
        return counts;
    }, { total: 0, pending: 0, accepted: 0, rejected: 0, completed: 0 });
}

function sbGetMentors() {
    return sbMentorCache;
}

function sbSetMentors(mentors) {
    if (!Array.isArray(mentors)) throw new Error('Mentor data must be a list.');
    sbMentorCache = mentors;
}

async function sbLoadMentors() {
    const { mentors } = await sbApi('/mentors');
    sbSetMentors(mentors);
    return mentors;
}

function sbOnPageActive(callback) {
    const onVisibilityChange = () => {
        if (!document.hidden) callback();
    };
    window.addEventListener('focus', callback);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
        window.removeEventListener('focus', callback);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
}

function sbUpdateNavbar() {
    const user = sbGetCurrentUser();
    const actions = document.querySelector('.nav-actions');
    if (!actions || !user) return;

    actions.textContent = '';
    const greeting = document.createElement('span');
    greeting.className = 'nav-user-greeting';
    greeting.textContent = `Hi, ${user.firstName}`;
    greeting.style.cssText = 'color:#fff;font-weight:500;font-size:.875rem;margin-right:.75rem;';

    const logoutButton = document.createElement('button');
    logoutButton.type = 'button';
    logoutButton.className = 'btn btn-outline btn-sm';
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        try {
            await sbLogout();
            window.location.href = 'index.html';
        } catch (error) {
            logoutButton.disabled = false;
            console.error('Unable to sign out:', error);
            window.alert(error.message);
        }
    });
    actions.append(greeting, logoutButton);
}

sbAuthReady.then(sbUpdateNavbar);
