/**
 * SkillBridge - Skill Details Logic
 * Dedicated JavaScript file for skill-details.html
 * Fetches data strictly from data/skill-details.json
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSkillDetails();
});

async function loadSkillDetails() {
    const mainLayout = document.querySelector('.detail-layout');
    if (mainLayout) {
        mainLayout.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/skill-details.json');
        if (!response.ok) {
            throw new Error(`Failed to load skill details: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const skill = data.skill;

        if (!skill) {
            throw new Error('Skill detail record not found.');
        }

        renderHeader(skill);
        renderAbout(skill.about);
        renderChecklist(skill.whatYoullLearn);
        renderMentors(skill.availableMentors);
        renderSidebar(skill.sidebar);
        setupFormInteraction();

    } catch (error) {
        console.error('Error loading skill details:', error);
        renderErrorState(error.message);
    } finally {
        if (mainLayout) {
            mainLayout.removeAttribute('aria-busy');
        }
    }
}

function renderHeader(skill) {
    const categoryBadge = document.querySelector('.detail-category-badge');
    const titleEl = document.querySelector('.detail-title');
    const instructorName = document.querySelector('.instructor-name');
    const instructorDetails = document.querySelector('.detail-instructor span:last-child');
    const avatar = document.querySelector('.detail-instructor .mentor-avatar-placeholder');
    const breadcrumbCurrent = document.querySelector('.breadcrumb .current');

    if (categoryBadge && skill.category) categoryBadge.textContent = skill.category;
    if (titleEl && skill.title) titleEl.textContent = skill.title;
    if (breadcrumbCurrent && skill.title) breadcrumbCurrent.textContent = skill.title;

    if (skill.instructor) {
        if (instructorName) instructorName.textContent = skill.instructor.name;
        if (instructorDetails) instructorDetails.textContent = ` · ${skill.instructor.details}`;
        if (avatar && skill.instructor.avatarText) avatar.textContent = skill.instructor.avatarText;
    }
}

function renderAbout(about) {
    if (!about || !Array.isArray(about.paragraphs)) return;

    const mainCol = document.querySelector('.detail-main');
    if (!mainCol) return;

    const existingDescriptions = mainCol.querySelectorAll('.detail-description');
    existingDescriptions.forEach(desc => desc.remove());

    const titleH2 = mainCol.querySelector('h2.detail-section-title');
    if (titleH2 && about.title) {
        titleH2.textContent = about.title;
    }

    // Insert paragraphs right after the section title
    if (titleH2) {
        let referenceNode = titleH2;
        about.paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.className = 'detail-description';
            p.textContent = text;
            referenceNode.after(p);
            referenceNode = p;
        });
    }
}

function renderChecklist(items) {
    const checklist = document.querySelector('.checklist');
    if (!checklist) return;

    checklist.textContent = '';

    if (!items || items.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Curriculum details coming soon.';
        checklist.append(li);
        return;
    }

    items.forEach(itemText => {
        const li = document.createElement('li');

        const iconSpan = document.createElement('span');
        iconSpan.className = 'check-icon';
        iconSpan.textContent = '✓';

        const textSpan = document.createElement('span');
        textSpan.textContent = itemText;

        li.append(iconSpan, textSpan);
        checklist.append(li);
    });
}

function renderMentors(mentors) {
    const container = document.querySelector('.detail-mentors');
    if (!container) return;

    container.textContent = '';

    if (!mentors || mentors.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.color = '#64748b';
        emptyMsg.textContent = 'No mentors currently listed for this skill.';
        container.append(emptyMsg);
        return;
    }

    mentors.forEach(mentor => {
        const card = document.createElement('div');
        card.className = 'mentor-card';

        const avatar = document.createElement('div');
        avatar.className = mentor.avatarClass || 'mentor-avatar-placeholder blue';
        avatar.textContent = mentor.avatarText || mentor.name.slice(0, 2).toUpperCase();

        const info = document.createElement('div');
        info.className = 'mentor-info';

        const name = document.createElement('h3');
        name.className = 'mentor-name';
        name.textContent = mentor.name;

        const bio = document.createElement('p');
        bio.className = 'mentor-bio';
        bio.textContent = mentor.bio;

        const rating = document.createElement('p');
        rating.className = 'mentor-rating';

        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '★★★★★';

        const strong = document.createElement('strong');
        strong.textContent = ` ${mentor.rating} `;

        const reviews = document.createTextNode(`(${mentor.reviews} reviews)`);

        rating.append(star, strong, reviews);
        info.append(name, bio, rating);

        const actions = document.createElement('div');
        actions.className = 'mentor-actions';

        const connectBtn = document.createElement('a');
        connectBtn.href = 'mentors.html';
        connectBtn.className = 'btn btn-primary btn-sm';
        connectBtn.textContent = 'Connect';

        actions.append(connectBtn);
        card.append(avatar, info, actions);
        container.append(card);
    });
}

function renderSidebar(sidebar) {
    if (!sidebar) return;

    const infoContainer = document.querySelector('.sidebar-info');
    if (infoContainer && Array.isArray(sidebar.info)) {
        infoContainer.textContent = '';
        sidebar.info.forEach(item => {
            const row = document.createElement('div');
            row.className = 'sidebar-info-item';

            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = item.label;

            const val = document.createElement('span');
            val.className = 'value';
            val.textContent = item.value;

            row.append(label, val);
            infoContainer.append(row);
        });
    }

    const textarea = document.querySelector('.sidebar-textarea');
    if (textarea && sidebar.placeholder) {
        textarea.placeholder = sidebar.placeholder;
    }
}

function setupFormInteraction() {
    const form = document.querySelector('.sidebar-card form');
    const textarea = document.querySelector('.sidebar-textarea');
    const button = form ? form.querySelector('button') : null;

    if (!form || !button || !textarea) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        const value = textarea.value.trim();
        if (!value) {
            textarea.style.borderColor = '#ef4444';
            textarea.focus();
            return;
        }

        textarea.style.borderColor = '#22c55e';
        button.textContent = 'Request Sent! ✓';
        button.disabled = true;
        button.style.backgroundColor = '#16a34a';

        const note = document.querySelector('.sidebar-note');
        if (note) {
            note.textContent = 'Your request has been submitted to available mentors!';
            note.style.color = '#16a34a';
            note.style.fontWeight = '600';
        }
    });
}

function renderErrorState(errorMessage) {
    const main = document.querySelector('.detail-main');
    if (!main) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-state';
    errorDiv.style.padding = '1.5rem';
    errorDiv.style.backgroundColor = '#fef2f2';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.margin = '1.5rem 0';
    errorDiv.textContent = `Unable to load skill details: ${errorMessage}`;
    main.prepend(errorDiv);
}

