/**
 * Shared browser storage for the SkillBridge frontend demonstration.
 * localStorage synchronizes records across tabs on this browser and origin.
 * The session is tab-scoped; neither this storage nor its authentication is
 * suitable for production or for synchronizing across devices.
 */

const SB_KEYS = {
    USERS: 'sb_users',
    SESSION: 'sb_session',
    REQUESTS: 'sb_requests',
    FEEDBACK: 'sb_feedback',
    MENTORS: 'sb_mentors',
    MIGRATED: 'sb_data_migrated',
};

function sbGet(key, fallback = []) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        console.error(`Unable to read SkillBridge data "${key}":`, error);
        try {
            localStorage.removeItem(key);
        } catch (removeError) {
            console.error(`Unable to clear invalid SkillBridge data "${key}":`, removeError);
        }
        return fallback;
    }
}

function sbSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Unable to save SkillBridge data "${key}":`, error);
        throw new Error('Your browser could not save this data. Check browser storage and try again.');
    }
}

function sbGetSession() {
    try {
        const raw = sessionStorage.getItem(SB_KEYS.SESSION);
        return raw === null ? null : JSON.parse(raw);
    } catch (error) {
        console.error('Unable to read the SkillBridge session:', error);
        sessionStorage.removeItem(SB_KEYS.SESSION);
        return null;
    }
}

function sbSetSession(user) {
    try {
        sessionStorage.setItem(SB_KEYS.SESSION, JSON.stringify(user));
    } catch (error) {
        console.error('Unable to save the SkillBridge session:', error);
        throw new Error('Your browser could not start a session. Check browser storage and try again.');
    }
}

function sbGenerateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function sbHashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Secure browser hashing is unavailable. Open SkillBridge through VS Code Live Server or a modern browser.');
    }
    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function sbGetUsers() {
    const users = sbGet(SB_KEYS.USERS);
    return Array.isArray(users) ? users : [];
}

function sbFindUserByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    return sbGetUsers().find(user => user.email.toLowerCase() === normalizedEmail) || null;
}

async function sbRegisterUser({ firstName, lastName, email, department, year, password }) {
    const users = sbGetUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some(user => user.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: 'An account with this email already exists.' };
    }

    const user = {
        id: sbGenerateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        department,
        year,
        passwordHash: await sbHashPassword(password),
        createdAt: new Date().toISOString(),
    };
    users.push(user);
    sbSet(SB_KEYS.USERS, users);
    return { ok: true, user };
}

async function sbLogin(email, password) {
    const user = sbFindUserByEmail(email);
    if (!user) return { ok: false, error: 'No account found with this email.' };
    if (!user.passwordHash) {
        return { ok: false, error: 'This account has no saved password. Please create an account again.' };
    }
    if (await sbHashPassword(password) !== user.passwordHash) {
        return { ok: false, error: 'Incorrect email or password.' };
    }

    const session = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        year: user.year,
    };
    sbSetSession(session);
    return { ok: true, user: session };
}

function sbGetCurrentUser() {
    return sbGetSession();
}

function sbLogout() {
    try {
        sessionStorage.removeItem(SB_KEYS.SESSION);
    } catch (error) {
        console.error('Unable to clear the SkillBridge session:', error);
        throw new Error('Your browser could not clear the session. Please try again.');
    }
}

function sbGetRequests(filters = {}) {
    const requests = sbGet(SB_KEYS.REQUESTS);
    const normalized = Array.isArray(requests) ? requests : [];
    return normalized.filter(request => {
        if (filters.status && request.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        if (filters.studentId && request.studentId !== filters.studentId) return false;
        if (filters.mentorId && String(request.mentorId) !== String(filters.mentorId)) return false;
        if (filters.mentorName && request.mentorName !== filters.mentorName) return false;
        return true;
    });
}

function sbFindRequestById(requestId) {
    return sbGetRequests().find(request => request.requestId === requestId) || null;
}

function sbCreateRequest({ skillId = null, skillName, description, mentorId = null, mentorName = '' }) {
    const student = sbGetCurrentUser();
    if (!student) return { ok: false, error: 'Please sign in before submitting a learning request.' };
    if (!skillName || !skillName.trim()) return { ok: false, error: 'Choose a skill before submitting your request.' };
    if (!description || !description.trim()) return { ok: false, error: 'Please describe what you would like to learn.' };

    const assignedMentor = sbGetMentors().find(mentor =>
        mentorName ? mentor.name === mentorName : String(mentor.id) === String(mentorId)
    );
    const now = new Date().toISOString();
    const request = {
        requestId: sbGenerateId(),
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        studentEmail: student.email,
        skillId,
        skillName: skillName.trim(),
        description: description.trim(),
        mentorId: assignedMentor ? assignedMentor.id : mentorId,
        mentorName: mentorName.trim(),
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
    };
    const requests = sbGetRequests();
    requests.unshift(request);
    sbSet(SB_KEYS.REQUESTS, requests);
    return { ok: true, request };
}

function sbUpdateRequestStatus(requestId, newStatus, mentor) {
    const allowedStatuses = ['Accepted', 'Rejected', 'Completed'];
    if (!allowedStatuses.includes(newStatus)) {
        return { ok: false, error: 'That request status is not supported.' };
    }

    const requests = sbGetRequests();
    const request = requests.find(item => item.requestId === requestId);
    if (!request) return { ok: false, error: 'This request could not be found. Refresh and try again.' };

    const isAssignedToMentor = request.mentorName
        ? request.mentorName === mentor?.name
        : request.mentorId !== null && String(request.mentorId) === String(mentor?.id);
    if (!isAssignedToMentor) {
        return { ok: false, error: 'This request is not assigned to the selected mentor.' };
    }

    const currentStatus = request.status.toLowerCase();
    const validTransition =
        (currentStatus === 'pending' && ['Accepted', 'Rejected'].includes(newStatus)) ||
        (currentStatus === 'accepted' && newStatus === 'Completed');
    if (!validTransition) {
        return { ok: false, error: `A ${currentStatus} request cannot be changed to ${newStatus}.` };
    }

    request.status = newStatus;
    request.updatedAt = new Date().toISOString();
    sbSet(SB_KEYS.REQUESTS, requests);
    return { ok: true, request };
}

function sbGetRequestCounts(requests = sbGetRequests()) {
    return requests.reduce((counts, request) => {
        const status = request.status.toLowerCase();
        counts.total += 1;
        if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
        return counts;
    }, { total: 0, pending: 0, accepted: 0, rejected: 0, completed: 0 });
}

function sbGetFeedback() {
    const feedback = sbGet(SB_KEYS.FEEDBACK);
    return Array.isArray(feedback) ? feedback : [];
}

function sbSaveFeedback(entry) {
    const user = sbGetCurrentUser();
    const savedEntry = {
        ...entry,
        feedbackId: sbGenerateId(),
        userId: user ? user.id : null,
        submittedAt: new Date().toISOString(),
    };
    sbSet(SB_KEYS.FEEDBACK, [savedEntry, ...sbGetFeedback()]);
    return savedEntry;
}

function sbGetMentors() {
    const mentors = sbGet(SB_KEYS.MENTORS);
    return Array.isArray(mentors) ? mentors : [];
}

function sbSetMentors(mentors) {
    if (!Array.isArray(mentors)) throw new Error('Mentor data must be a list.');
    sbSet(SB_KEYS.MENTORS, mentors);
}

async function sbLoadMentors() {
    const storedMentors = sbGetMentors();
    if (storedMentors.length) return storedMentors;
    const response = await fetch('data/mentors.json');
    if (!response.ok) {
        throw new Error(`Unable to load mentors: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.mentors)) throw new Error('Mentor data is missing its mentor list.');
    sbSetMentors(data.mentors);
    return data.mentors;
}

function sbMigrateExistingData() {
    if (sbGet(SB_KEYS.MIGRATED, false)) return;

    const stored = sbGet(SB_KEYS.REQUESTS);
    if (!Array.isArray(stored)) {
        sbSet(SB_KEYS.REQUESTS, []);
    } else {
        const sampleIds = new Set(Array.from({ length: 10 }, (_, index) => `seed-${index + 1}`));
        const migrated = stored
            .filter(request => !sampleIds.has(request.requestId || request.id))
            .map(request => {
                const status = request.status === 'Declined' ? 'Rejected' : request.status;
                return {
                    requestId: String(request.requestId || request.id || sbGenerateId()),
                    studentId: request.studentId || request.userId || '',
                    studentName: request.studentName || request.userName || '',
                    studentEmail: request.studentEmail || '',
                    skillId: request.skillId || null,
                    skillName: request.skillName || request.skillTitle || request.exchange?.learning || '',
                    description: request.description || '',
                    mentorId: request.mentorId || null,
                    mentorName: request.mentorName || request.partner?.name || '',
                    status: status || 'Pending',
                    createdAt: request.createdAt || request.date || new Date().toISOString(),
                    updatedAt: request.updatedAt || request.createdAt || request.date || new Date().toISOString(),
                };
            });
        sbSet(SB_KEYS.REQUESTS, migrated);
    }
    sbSet(SB_KEYS.MIGRATED, true);
}

function sbOnStorageChange(callback, keys = [SB_KEYS.USERS, SB_KEYS.REQUESTS, SB_KEYS.FEEDBACK, SB_KEYS.MENTORS]) {
    const handler = event => {
        if (keys.includes(event.key)) callback(event.key, event.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
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
    logoutButton.addEventListener('click', () => {
        try {
            sbLogout();
            window.location.href = 'index.html';
        } catch (error) {
            window.alert(error.message);
        }
    });
    actions.append(greeting, logoutButton);
}

document.addEventListener('DOMContentLoaded', () => {
    sbMigrateExistingData();
    sbUpdateNavbar();
});
