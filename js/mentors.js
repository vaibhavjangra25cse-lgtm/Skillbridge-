/**
 * SkillBridge - Mentors Page Logic
 * Dedicated JavaScript file for mentors.html
 * Loads mentor records from the Express API.
 *
 * NOTE: Dynamic data loading requires an HTTP server.
 * Open via VS Code Live Server or any local server — do NOT use file:// directly.
 */

document.addEventListener('DOMContentLoaded', () => {
    sbOnPageActive(renderMentorRequests);
    loadMentorsData();
});

let allMentors = [];
let allSkills = [];

const mentorSkillCategories = {
    programming: ['python', 'java', 'javascript', 'react', 'node', 'web development'],
    design: ['design', 'figma', 'ui/ux', 'autocad'],
    language: ['language', 'spanish', 'french', 'mandarin'],
    photography: ['photography', 'photo editing'],
    business: ['business', 'finance', 'excel', 'research'],
};

async function loadMentorsData() {
    await sbAuthReady;
    const sectionContainer = document.querySelector('.section[aria-labelledby="mentor-list-title"] .container');
    if (sectionContainer) {
        sectionContainer.setAttribute('aria-busy', 'true');
        sectionContainer.querySelectorAll('.mentor-card').forEach(card => card.remove());
    }

    try {
        const [mentors, skills] = await Promise.all([
            sbLoadMentors(),
            sbApi('/skills').then(result => result.skills),
        ]);

        allMentors = mentors;
        allSkills = skills;

        // Setup filter listeners
        setupMentorFilters();

        // Render mentors
        renderMentors(allMentors);
        await setupMentorRequestPanel();

    } catch (error) {
        console.error('Error loading mentors data:', error);
        renderErrorState(error.message);
    } finally {
        if (sectionContainer) {
            sectionContainer.removeAttribute('aria-busy');
        }
    }
}

function setupMentorFilters() {
    const searchInput = document.getElementById('mentor-search');
    const skillSelect = document.getElementById('filter-skill');
    const deptSelect = document.getElementById('filter-department');
    const yearSelect = document.getElementById('filter-year');
    const expSelect = document.getElementById('filter-experience');
    const filterBtn = document.querySelector('.filter-button');

    const handleFilter = async () => {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedSkill = skillSelect ? skillSelect.value : 'Any Skill';
        const selectedDept = deptSelect ? deptSelect.value : 'Any Department';
        const selectedYear = yearSelect ? yearSelect.value : 'Any Year';
        const selectedExp = expSelect ? expSelect.value : 'Any Experience';
        const categoryTerms = mentorSkillCategories[selectedSkill.toLowerCase()];
        const filters = new URLSearchParams();
        if (query) filters.set('search', query);
        if (categoryTerms) filters.set('expertise', categoryTerms.join(','));
        if (selectedDept !== 'Any Department') filters.set('department', selectedDept === 'Media' ? 'Mass Communication' : selectedDept);
        if (selectedYear !== 'Any Year') filters.set('year', selectedYear);
        try {
            const result = await sbApi(`/mentors?${filters}`);
            const mentors = selectedExp === 'Any Experience'
                ? result.mentors
                : result.mentors.filter(mentor => mentorMatchesExperience(mentor, selectedExp));
            renderMentors(mentors);
        } catch (error) {
            console.error('Unable to filter mentors:', error);
            renderErrorState(error.message);
        }
    };

    if (searchInput) searchInput.addEventListener('input', handleFilter);
    if (skillSelect) skillSelect.addEventListener('change', handleFilter);
    if (deptSelect) deptSelect.addEventListener('change', handleFilter);
    if (yearSelect) yearSelect.addEventListener('change', handleFilter);
    if (expSelect) expSelect.addEventListener('change', handleFilter);
    if (filterBtn) filterBtn.addEventListener('click', handleFilter);
}

function mentorMatchesSkill(mentor, selectedSkill) {
    if (selectedSkill === 'Any Skill') return true;

    const categoryTerms = mentorSkillCategories[selectedSkill.toLowerCase()];
    const searchText = `${mentor.teaches || ''} ${(mentor.expertise || []).join(' ')} ${mentor.department}`.toLowerCase();
    return (categoryTerms || [selectedSkill.toLowerCase()]).some(term => searchText.includes(term));
}

function mentorMatchesExperience(mentor, selectedExperience) {
    if (selectedExperience === 'Any Experience') return true;

    const experience = mentor.experience.toLowerCase();
    const years = Number.parseFloat(experience);
    if (Number.isNaN(years)) return experience.includes(selectedExperience.toLowerCase());

    if (selectedExperience === 'Beginner') return years < 1;
    if (selectedExperience === '1-2 Years') return years >= 1 && years <= 2 && !experience.includes('+');
    if (selectedExperience === '2-3 Years') return years >= 2 && years <= 3;
    if (selectedExperience === '3+ Years') return years >= 3;
    return experience.includes(selectedExperience.toLowerCase());
}

function renderMentors(mentors) {
    const sectionContainer = document.querySelector('.section[aria-labelledby="mentor-list-title"] .container');
    if (!sectionContainer) return;

    // Retain the section heading
    const heading = sectionContainer.querySelector('.section-heading');

    // Remove old cards or empty states
    const existingCards = sectionContainer.querySelectorAll('.mentor-card, .empty-state, .error-state');
    existingCards.forEach(card => card.remove());

    if (!mentors || mentors.length === 0) {
        renderEmptyState(sectionContainer);
        return;
    }

    mentors.forEach(mentor => {
        const article = document.createElement('article');
        article.className = 'mentor-card';

        // Avatar
        if (mentor.avatar && mentor.avatar.type === 'image') {
            const img = document.createElement('img');
            img.src = mentor.avatar.src || 'images/learning-placeholder.svg';
            img.alt = mentor.avatar.alt || mentor.name;
            img.className = mentor.avatar.className || 'mentor-avatar';
            article.append(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = mentor.avatar && mentor.avatar.className ? mentor.avatar.className : 'mentor-avatar-placeholder blue';
            if (mentor.avatar && mentor.avatar.bgColor) {
                placeholder.style.backgroundColor = mentor.avatar.bgColor;
            }
            placeholder.textContent = mentor.avatar && mentor.avatar.text ? mentor.avatar.text : mentor.name.slice(0, 2).toUpperCase();
            article.append(placeholder);
        }

        // Mentor info
        const info = document.createElement('div');
        info.className = 'mentor-info';

        const name = document.createElement('h3');
        name.className = 'mentor-name';
        name.textContent = mentor.name;

        const bio = document.createElement('p');
        bio.className = 'mentor-bio';
        bio.textContent = mentor.bio;

        const metaRow = document.createElement('div');
        metaRow.className = 'mentor-meta-row';

        const expBadge = document.createElement('span');
        expBadge.className = 'mentor-exp-badge';
        expBadge.textContent = `Experience: ${mentor.experience}`;

        const ratingSpan = document.createElement('span');
        ratingSpan.className = 'mentor-rating';

        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★';

        const ratingStrong = document.createElement('strong');
        ratingStrong.textContent = ` ${mentor.rating} `;

        const reviewsText = document.createTextNode(`(${mentor.reviews} reviews)`);

        ratingSpan.append(star, ratingStrong, reviewsText);
        metaRow.append(expBadge, ratingSpan);

        // Skills container
        const skillsDiv = document.createElement('div');
        skillsDiv.className = 'mentor-skills';

        // Teaches
        const teachesGroup = document.createElement('div');
        teachesGroup.className = 'mentor-skill-group';
        const teachesLabel = document.createElement('span');
        teachesLabel.className = 'skill-label teaches';
        teachesLabel.textContent = 'Teaches';
        const teachesList = document.createElement('p');
        teachesList.className = 'mentor-skill-list';
        teachesList.textContent = mentor.teaches || (mentor.expertise || []).join(', ') || 'Skills coming soon';
        teachesGroup.append(teachesLabel, teachesList);

        // Wants to Learn
        const wantsGroup = document.createElement('div');
        wantsGroup.className = 'mentor-skill-group';
        const wantsLabel = document.createElement('span');
        wantsLabel.className = 'skill-label wants';
        wantsLabel.textContent = 'Wants to Learn';
        const wantsList = document.createElement('p');
        wantsList.className = 'mentor-skill-list';
        wantsList.textContent = mentor.wantsToLearn;
        wantsGroup.append(wantsLabel, wantsList);

        skillsDiv.append(teachesGroup, wantsGroup);

        info.append(name, bio, metaRow, skillsDiv);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'mentor-actions';

        const viewProfileBtn = document.createElement('a');
        viewProfileBtn.href = '#';
        viewProfileBtn.className = 'btn-view-profile';
        viewProfileBtn.textContent = 'View Profile';
        viewProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Viewing profile for ${mentor.name}`);
        });

        const connectBtn = document.createElement('button');
        connectBtn.type = 'button';
        connectBtn.className = 'btn btn-primary btn-sm';
        connectBtn.textContent = 'Connect';
        connectBtn.addEventListener('click', async () => {
            const availableSkills = allSkills.map(skill => skill.title);
            const skillName = window.prompt(`Which skill would you like to learn from ${mentor.name}?\nAvailable skills: ${availableSkills.join(', ')}`);
            if (skillName === null) return;
            const skill = allSkills.find(item => item.title.toLowerCase() === skillName.trim().toLowerCase());
            if (!skill) {
                window.alert('Choose a skill from the available skill list.');
                return;
            }
            const description = window.prompt('Briefly describe what you would like to learn.');
            if (description === null) return;
            if (!description.trim()) {
                window.alert('Please describe what you would like to learn.');
                return;
            }
            try {
                const result = await sbCreateRequest({
                    skillId: skill.id,
                    description,
                    mentorId: mentor.id,
                    mentorName: mentor.name,
                });
                if (!result.ok) {
                    if (result.error.includes('sign in')) {
                        if (window.confirm(`${result.error} Go to Sign In now?`)) window.location.href = 'login.html';
                        return;
                    }
                    window.alert(result.error);
                    return;
                }
                connectBtn.textContent = 'Request Sent ✓';
                connectBtn.disabled = true;
                window.alert('Your learning request has been saved. You can track it on the Requests page.');
                await renderMentorRequests();
            } catch (error) {
                console.error('Unable to save mentor request:', error);
                window.alert(error.message || 'Unable to save your request. Please try again.');
            }
        });

        actions.append(viewProfileBtn, connectBtn);

        article.append(info, actions);
        sectionContainer.append(article);
    });
}

async function setupMentorRequestPanel() {
    const section = document.querySelector('.mentor-requests-section');
    if (!section) return;
    const user = sbGetCurrentUser();
    if (user?.role !== 'mentor') {
        section.hidden = true;
        return;
    }
    section.hidden = false;

    let profile;
    try {
        const result = await sbApi('/mentors/me');
        profile = result.mentor;
    } catch (error) {
        console.error('Unable to load incoming learning requests:', error);
        const container = document.getElementById('mentor-request-list');
        if (container) container.textContent = `Unable to load requests: ${error.message}`;
        return;
    }
    setupMentorProfileForm(profile);
    await renderMentorRequests();
}

function setupMentorProfileForm(profile) {
    const form = document.getElementById('mentor-profile-form');
    if (!form) return;

    document.getElementById('mentor-profile-teaches').value = profile.teaches || '';
    document.getElementById('mentor-profile-expertise').value = (profile.expertise || []).join(', ');
    document.getElementById('mentor-profile-experience').value = profile.experience || '';
    document.getElementById('mentor-profile-availability').value = profile.availability || '';
    document.getElementById('mentor-profile-wants').value = profile.wantsToLearn || '';
    document.getElementById('mentor-profile-bio').value = profile.bio || '';

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const status = document.getElementById('mentor-profile-status');
        if (button) button.disabled = true;
        if (status) status.textContent = 'Saving profile...';

        try {
            await sbApi('/mentors/me', {
                method: 'PUT',
                body: {
                    teaches: document.getElementById('mentor-profile-teaches').value.trim(),
                    expertise: document.getElementById('mentor-profile-expertise').value
                        .split(',')
                        .map(value => value.trim())
                        .filter(Boolean),
                    experience: document.getElementById('mentor-profile-experience').value.trim(),
                    availability: document.getElementById('mentor-profile-availability').value.trim(),
                    wantsToLearn: document.getElementById('mentor-profile-wants').value.trim(),
                    bio: document.getElementById('mentor-profile-bio').value.trim(),
                },
            });
            if (status) status.textContent = 'Profile saved.';
            try {
                allMentors = await sbLoadMentors();
                renderMentors(allMentors);
            } catch (error) {
                console.error('Profile saved, but the public mentor list could not be refreshed:', error);
            }
        } catch (error) {
            console.error('Unable to save mentor profile:', error);
            if (status) status.textContent = error.message || 'Unable to save your profile.';
        } finally {
            if (button) button.disabled = false;
        }
    });
}

async function renderMentorRequests() {
    const container = document.getElementById('mentor-request-list');
    if (!container) return;

    if (sbGetCurrentUser()?.role !== 'mentor') return;
    let incoming;
    try {
        incoming = await sbGetRequests('/requests/assigned');
    } catch (error) {
        console.error('Unable to load mentor requests:', error);
        container.textContent = `Unable to load requests: ${error.message}`;
        return;
    }
    container.textContent = '';
    if (incoming.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'mentor-request-empty';
        empty.textContent = 'There are no requests assigned to your mentor profile.';
        container.append(empty);
        return;
    }

    incoming.forEach(request => {
        const card = document.createElement('article');
        card.className = 'mentor-request-card';
        const title = document.createElement('h3');
        title.textContent = `${request.studentName || 'Student'} · ${request.skillName}`;
        const date = document.createElement('p');
        date.className = 'mentor-request-date';
        const submittedAt = new Date(request.createdAt);
        date.textContent = Number.isNaN(submittedAt.getTime())
            ? ''
            : `Submitted ${submittedAt.toLocaleDateString()}`;
        const description = document.createElement('p');
        description.textContent = request.description;
        const status = document.createElement('span');
        status.className = `status-badge ${mentorStatusClass(request.status)}`;
        status.textContent = request.status;
        card.append(title, date, description, status);

        const actions = document.createElement('div');
        actions.className = 'mentor-request-actions';
        const allowedActions = request.status === 'Pending'
            ? [['Accepted', 'Accept'], ['Rejected', 'Reject']]
            : request.status === 'Accepted' ? [['Completed', 'Mark completed']] : [];
        allowedActions.forEach(([statusValue, label]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-primary btn-sm';
            button.textContent = label;
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    const result = await sbUpdateRequestStatus(request.requestId, statusValue);
                    if (!result.ok) {
                        button.disabled = false;
                        window.alert(result.error);
                        return;
                    }
                    await renderMentorRequests();
                } catch (error) {
                    button.disabled = false;
                    console.error('Unable to update request status:', error);
                    window.alert(error.message || 'Unable to update this request. Please try again.');
                }
            });
            actions.append(button);
        });
        if (allowedActions.length) card.append(actions);
        container.append(card);
    });
}

function mentorStatusClass(status) {
    return {
        Pending: 'status-pending',
        Accepted: 'status-confirmed',
        Rejected: 'status-declined',
        Completed: 'status-completed',
    }[status] || '';
}

function renderEmptyState(container) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-state';
    emptyBox.style.padding = '3rem 1.5rem';
    emptyBox.style.textAlign = 'center';
    emptyBox.style.color = '#64748b';
    emptyBox.style.backgroundColor = '#f8fafc';
    emptyBox.style.borderRadius = '8px';
    emptyBox.style.marginTop = '1.5rem';

    const p = document.createElement('p');
    p.style.fontSize = '1.125rem';
    p.textContent = 'No mentors found matching your filters. Try selecting different criteria.';
    emptyBox.append(p);

    container.append(emptyBox);
}

function renderErrorState(errorMessage) {
    const container = document.querySelector('.section[aria-labelledby="mentor-list-title"] .container');
    if (!container) return;
    container.querySelectorAll('.mentor-card, .empty-state, .error-state').forEach(card => card.remove());

    const errorBox = document.createElement('div');
    errorBox.className = 'error-state';
    errorBox.style.padding = '2rem';
    errorBox.style.textAlign = 'center';
    errorBox.style.color = '#dc2626';
    errorBox.style.backgroundColor = '#fef2f2';
    errorBox.style.borderRadius = '8px';
    errorBox.style.border = '1px solid #fee2e2';
    errorBox.style.marginTop = '1.5rem';

    const p = document.createElement('p');
    p.textContent = `Unable to load mentors: ${errorMessage}. Please try refreshing.`;
    errorBox.append(p);

    container.append(errorBox);
}

/**
 * Shows a dismissible banner when the page is opened via file:// protocol.
 * Dynamic data requires an HTTP server (e.g. VS Code Live Server).
 */
function showFileProtocolBanner() {
    const banner = document.createElement('div');
    banner.id = 'file-protocol-banner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
        'background:#1e40af', 'color:#fff', 'padding:0.75rem 1.25rem',
        'display:flex', 'align-items:center', 'justify-content:space-between',
        'font-family:Inter,sans-serif', 'font-size:0.875rem', 'line-height:1.4',
        'box-shadow:0 2px 8px rgba(0,0,0,0.3)'
    ].join(';');

    const msg = document.createElement('span');
    msg.textContent = '⚠️  For live data, open this page via a local server (e.g. VS Code → "Go Live"). ' +
        'Static content is visible below — all navigation works normally.';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Dismiss notice');
    closeBtn.style.cssText = [
        'background:transparent', 'border:1px solid rgba(255,255,255,0.5)',
        'color:#fff', 'cursor:pointer', 'border-radius:4px',
        'padding:0.25rem 0.5rem', 'font-size:1rem', 'margin-left:1rem', 'flex-shrink:0'
    ].join(';');
    closeBtn.addEventListener('click', () => banner.remove());

    banner.append(msg, closeBtn);
    document.body.prepend(banner);

    document.body.style.paddingTop = '48px';
}
