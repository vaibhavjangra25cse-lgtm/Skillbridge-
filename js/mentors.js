/**
 * SkillBridge - Mentors Page Logic
 * Dedicated JavaScript file for mentors.html
 * Fetches data strictly from data/mentors.json
 */

document.addEventListener('DOMContentLoaded', () => {
    loadMentorsData();
});

let allMentors = [];

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

        // Setup filter listeners
        setupMentorFilters();

        // Render mentors
        renderMentors(allMentors);

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

            const matchesSkill = (selectedSkill === 'Any Skill') ||
                mentor.teaches.toLowerCase().includes(selectedSkill.toLowerCase());

            const matchesDept = (selectedDept === 'Any Department') ||
                (mentor.department && mentor.department.toLowerCase() === selectedDept.toLowerCase()) ||
                mentor.bio.toLowerCase().includes(selectedDept.toLowerCase());

            const matchesYear = (selectedYear === 'Any Year') ||
                (mentor.year && mentor.year.toLowerCase() === selectedYear.toLowerCase()) ||
                mentor.bio.toLowerCase().includes(selectedYear.toLowerCase());

            const matchesExp = (selectedExp === 'Any Experience') ||
                mentor.experience.toLowerCase().includes(selectedExp.toLowerCase());

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
            connectBtn.textContent = 'Requested ✓';
            connectBtn.disabled = true;
            connectBtn.style.opacity = '0.8';
        });

        actions.append(viewProfileBtn, connectBtn);

        article.append(info, actions);
        sectionContainer.append(article);
    });
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

