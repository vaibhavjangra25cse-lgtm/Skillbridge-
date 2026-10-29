/**
 * SkillBridge - Explore Skills Logic
 * Dedicated JavaScript file for explore.html
 * Fetches data strictly from data/explore.json
 *
 * NOTE: Dynamic data loading requires an HTTP server.
 * Open via VS Code Live Server or any local server — do NOT use file:// directly.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === 'file:') {
        showFileProtocolBanner();
        // Keep existing static HTML cards visible — do not replace them with an error
        setupExploreInteractions();
        return;
    }
    loadExploreData();
});

let allSkills = [];
let activeCategory = 'All';
let searchQuery = '';

async function loadExploreData() {
    const grid = document.querySelector('.skill-grid');
    if (grid) {
        grid.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/explore.json');
        if (!response.ok) {
            throw new Error(`Failed to load explore data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Update header if present
        if (data.pageHeader) {
            const pageTitle = document.querySelector('.page-title');
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageTitle && data.pageHeader.title) pageTitle.textContent = data.pageHeader.title;
            if (pageSubtitle && data.pageHeader.subtitle) pageSubtitle.textContent = data.pageHeader.subtitle;
        }

        allSkills = Array.isArray(data.skills) ? data.skills : [];

        // Setup filter pills and search event listeners
        setupExploreInteractions();

        // Initial render
        renderSkillCards(filterSkills());

    } catch (error) {
        console.error('Error loading explore data:', error);
        renderErrorState(error.message);
    } finally {
        if (grid) {
            grid.removeAttribute('aria-busy');
        }
    }
}

function setupExploreInteractions() {
    // Search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderSkillCards(filterSkills());
        });
    }

    // Filter pills
    const pills = document.querySelectorAll('.filter-pills .filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.textContent.trim();
            renderSkillCards(filterSkills());
        });
    });
}

function filterSkills() {
    return allSkills.filter(skill => {
        const matchesCategory = (activeCategory === 'All') ||
            (skill.category && skill.category.toLowerCase() === activeCategory.toLowerCase());

        const matchesSearch = !searchQuery ||
            (skill.title && skill.title.toLowerCase().includes(searchQuery)) ||
            (skill.description && skill.description.toLowerCase().includes(searchQuery)) ||
            (skill.teacher && skill.teacher.toLowerCase().includes(searchQuery));

        return matchesCategory && matchesSearch;
    });
}

function renderSkillCards(skills) {
    const grid = document.querySelector('.skill-grid');
    if (!grid) return;

    grid.textContent = '';

    if (!skills || skills.length === 0) {
        renderEmptyState(grid);
        return;
    }

    skills.forEach(skill => {
        const article = document.createElement('article');
        article.className = 'skill-card';

        // Skill Image
        const img = document.createElement('img');
        img.className = 'skill-card-image';
        img.src = skill.image || 'images/hero.jpg';
        img.alt = skill.alt || skill.title || 'Skill Image';
        article.append(img);

        // Body
        const body = document.createElement('div');
        body.className = 'skill-card-body';

        // Meta tags
        const meta = document.createElement('div');
        meta.className = 'skill-card-meta';

        const categoryBadge = document.createElement('span');
        categoryBadge.className = `category-badge ${skill.categoryClass || 'badge-programming'}`;
        categoryBadge.textContent = skill.category || 'Skill';

        const difficultyBadge = document.createElement('span');
        difficultyBadge.className = 'difficulty-badge';
        difficultyBadge.textContent = skill.difficulty || 'All Levels';

        meta.append(categoryBadge, difficultyBadge);

        // Title
        const title = document.createElement('h3');
        title.className = 'skill-card-title';
        title.textContent = skill.title || '';

        // Description
        const desc = document.createElement('p');
        desc.className = 'skill-card-desc';
        desc.textContent = skill.description || '';

        // Teacher
        const teacher = document.createElement('p');
        teacher.className = 'skill-card-teacher';
        teacher.textContent = skill.teacher ? `Taught by ${skill.teacher}` : '';

        // Footer
        const footer = document.createElement('div');
        footer.className = 'skill-card-footer';

        const countSpan = document.createElement('span');
        countSpan.className = 'mentor-count';
        countSpan.textContent = skill.mentorCount ? `${skill.mentorCount} students teaching` : 'Students teaching';

        const link = document.createElement('a');
        link.className = 'card-link';
        link.href = skill.detailUrl || 'skill-details.html';
        link.textContent = 'Explore Skill';

        footer.append(countSpan, link);

        body.append(meta, title, desc, teacher, footer);
        article.append(body);
        grid.append(article);
    });
}

function renderEmptyState(grid) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-state';
    emptyBox.style.gridColumn = '1 / -1';
    emptyBox.style.padding = '3rem 1.5rem';
    emptyBox.style.textAlign = 'center';
    emptyBox.style.color = '#64748b';

    const p = document.createElement('p');
    p.style.fontSize = '1.125rem';
    p.textContent = 'No skills found matching your search or category filter.';
    emptyBox.append(p);

    grid.append(emptyBox);
}

function renderErrorState(errorMessage) {
    const grid = document.querySelector('.skill-grid');
    if (!grid) return;

    grid.textContent = '';
    const errorBox = document.createElement('div');
    errorBox.className = 'error-state';
    errorBox.style.gridColumn = '1 / -1';
    errorBox.style.padding = '2rem';
    errorBox.style.textAlign = 'center';
    errorBox.style.color = '#dc2626';
    errorBox.style.backgroundColor = '#fef2f2';
    errorBox.style.borderRadius = '8px';
    errorBox.style.border = '1px solid #fee2e2';

    const p = document.createElement('p');
    p.textContent = `Unable to load skills: ${errorMessage}. Please try refreshing.`;
    errorBox.append(p);
    grid.append(errorBox);
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

    // Push main content down so banner doesn't overlap navbar
    document.body.style.paddingTop = '48px';
}

