/**
 * SkillBridge - Mentors Page Logic
 * Dedicated JavaScript file for mentors.html
 * Fetches data strictly from data/mentors.json
 *
 * NOTE: Dynamic data loading requires an HTTP server.
 * Open via VS Code Live Server or any local server — do NOT use file:// directly.
 */

document.addEventListener('DOMContentLoaded', () => {
    sbOnStorageChange(key => {
        if (key === SB_KEYS.REQUESTS) setupMentorRequestPanel();
        else if (key === SB_KEYS.MENTORS) renderMentorRequests();
    });
    sbOnPageActive(renderMentorRequests);
    if (window.location.protocol === 'file:') {
        showFileProtocolBanner();
        allMentors = sbGetMentors();
        setupMentorFilters();
        setupMentorRequestPanel();
        renderMentorRequests();
        return;
    }
    loadMentorsData();
});

let allMentors = [];

const mentorSkillCategories = {
    programming: ['python', 'java', 'javascript', 'react', 'node', 'web development'],
    design: ['design', 'figma', 'ui/ux', 'autocad'],
    language: ['language', 'spanish', 'french', 'mandarin'],
    photography: ['photography', 'photo editing'],
    business: ['business', 'finance', 'excel', 'research'],
};

async function loadMentorsData() {
    const sectionContainer = document.querySelector('.section[aria-labelledby="mentor-list-title"] .container');
    if (sectionContainer) {
        sectionContainer.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/mentors.json');
        if (!response.ok) {
            throw new Error(`Failed to load mentors data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Populate header if available
        if (data.pageHeader) {
            const pageTitle = document.getElementById('mentors-page-title');
            const pageSubtitle = document.querySelector('.page-header .page-subtitle');
            if (pageTitle && data.pageHeader.title) pageTitle.textContent = data.pageHeader.title;
            if (pageSubtitle && data.pageHeader.subtitle) pageSubtitle.textContent = data.pageHeader.subtitle;
        }

        allMentors = Array.isArray(data.mentors) ? data.mentors : [];
        sbSetMentors(allMentors);

        // Setup filter listeners
        setupMentorFilters();

        // Render mentors
        renderMentors(allMentors);
        setupMentorRequestPanel();

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

    const handleFilter = () => {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedSkill = skillSelect ? skillSelect.value : 'Any Skill';
        const selectedDept = deptSelect ? deptSelect.value : 'Any Department';
        const selectedYear = yearSelect ? yearSelect.value : 'Any Year';
        const selectedExp = expSelect ? expSelect.value : 'Any Experience';

        const filtered = allMentors.filter(mentor => {
            const matchesQuery = !query ||
                mentor.name.toLowerCase().includes(query) ||
                mentor.bio.toLowerCase().includes(query) ||
                mentor.teaches.toLowerCase().includes(query) ||
                mentor.wantsToLearn.toLowerCase().includes(query);

            const matchesSkill = mentorMatchesSkill(mentor, selectedSkill);

            const departmentTerm = selectedDept === 'Media' ? 'mass communication' : selectedDept.toLowerCase();
            const matchesDept = (selectedDept === 'Any Department') ||
                (mentor.department && mentor.department.toLowerCase().includes(departmentTerm)) ||
                mentor.bio.toLowerCase().includes(departmentTerm);

            const matchesYear = (selectedYear === 'Any Year') ||
                (mentor.year && mentor.year.toLowerCase() === selectedYear.toLowerCase()) ||
                mentor.bio.toLowerCase().includes(selectedYear.toLowerCase());

            const matchesExp = mentorMatchesExperience(mentor, selectedExp);

            return matchesQuery && matchesSkill && matchesDept && matchesYear && matchesExp;
        });

        renderMentors(filtered);
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
    const searchText = `${mentor.teaches} ${mentor.department}`.toLowerCase();
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
            img.src = mentor.avatar.src || 'images/hero.jpg';
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
        teachesList.textContent = mentor.teaches;
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
        connectBtn.addEventListener('click', () => {
            if (!sbGetCurrentUser()) {
                window.alert('Please sign in before connecting with a mentor.');
                window.location.href = 'login.html';
                return;
            }
            const skillName = window.prompt(`What would you like to learn from ${mentor.name}?`);
            if (skillName === null) return;
            if (!skillName.trim()) {
                window.alert('Please enter the skill you want to learn.');
                return;
            }
            const description = window.prompt('Briefly describe what you would like to learn.');
            if (description === null) return;
            if (!description.trim()) {
                window.alert('Please describe what you would like to learn.');
                return;
            }
            try {
                const result = sbCreateRequest({
                    skillName,
                    description,
                    mentorId: mentor.id,
                    mentorName: mentor.name,
                });
                if (!result.ok) {
                    window.alert(result.error);
                    return;
                }
                connectBtn.textContent = 'Request Sent ✓';
                connectBtn.disabled = true;
                window.alert('Your learning request has been saved. You can track it on the Requests page.');
                renderMentorRequests();
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

function setupMentorRequestPanel() {
    const select = document.getElementById('active-mentor');
    if (!select) return;

    const requests = sbGetRequests();
    const requestNames = requests.map(request => request.mentorName).filter(Boolean);
    const names = [...new Set([...allMentors.map(mentor => mentor.name), ...requestNames])];
    select.textContent = '';
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.append(option);
    });
    if (select.dataset.bound !== 'true') {
        select.addEventListener('change', renderMentorRequests);
        select.dataset.bound = 'true';
    }

    const assignedName = requests.find(request => request.status === 'Pending')?.mentorName;
    if (assignedName && names.includes(assignedName)) select.value = assignedName;
    else if (names.length && !select.value) select.value = names[0];
    renderMentorRequests();
}

function renderMentorRequests() {
    const container = document.getElementById('mentor-request-list');
    const select = document.getElementById('active-mentor');
    if (!container || !select) return;

    const selectedMentor = allMentors.find(mentor => mentor.name === select.value) ||
        { id: null, name: select.value };
    const incoming = sbGetRequests().filter(request =>
        request.mentorName
            ? request.mentorName === selectedMentor.name
            : request.mentorId !== null && String(request.mentorId) === String(selectedMentor.id)
    );
    container.textContent = '';
    if (!selectedMentor.name || incoming.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'mentor-request-empty';
        empty.textContent = selectedMentor.name
            ? 'There are no requests assigned to this mentor.'
            : 'No mentor requests are available yet.';
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
            button.addEventListener('click', () => {
                try {
                    const result = sbUpdateRequestStatus(request.requestId, statusValue, selectedMentor);
                    if (!result.ok) {
                        window.alert(result.error);
                        return;
                    }
                    renderMentorRequests();
                } catch (error) {
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
