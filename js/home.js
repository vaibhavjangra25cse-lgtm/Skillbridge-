/**
 * SkillBridge - Home Page Logic
 * Dedicated JavaScript file for index.html
 * Fetches data strictly from data/home.json
 *
 * NOTE: Dynamic data loading requires an HTTP server.
 * Open via VS Code Live Server or any local server — do NOT use file:// directly.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === 'file:') {
        showFileProtocolBanner();
        // Keep existing static HTML content visible
        return;
    }
    loadHomeData();
});

async function loadHomeData() {
    const skillGrid = document.querySelector('.skill-grid');
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');

    // Show initial loading state if skill grid is present
    if (skillGrid) {
        skillGrid.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/home.json');
        if (!response.ok) {
            throw new Error(`Failed to load home data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Render Hero Content if needed
        if (data.hero) {
            renderHero(data.hero);
        }

        // Render Popular Skills
        if (data.popularSkills && data.popularSkills.skills) {
            renderPopularSkills(data.popularSkills.skills);
        } else {
            renderEmptySkillsState();
        }

        // Render How It Works
        if (data.howItWorks && data.howItWorks.steps) {
            renderHowItWorks(data.howItWorks.steps);
        }

        // Render Benefits
        if (data.benefits && data.benefits.items) {
            renderBenefits(data.benefits.items);
        }

    } catch (error) {
        console.error('Error loading home page data:', error);
        renderErrorState(error.message);
    } finally {
        if (skillGrid) {
            skillGrid.removeAttribute('aria-busy');
        }
    }
}

function renderHero(hero) {
    const heroBadge = document.querySelector('.hero-badge');
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-description');

    if (heroBadge && hero.badge) {
        heroBadge.textContent = hero.badge;
    }

    if (heroTitle && hero.title) {
        heroTitle.textContent = '';
        if (hero.highlight && hero.title.includes(hero.highlight)) {
            const parts = hero.title.split(hero.highlight);
            if (parts[0]) {
                heroTitle.appendChild(document.createTextNode(parts[0]));
            }
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'highlight';
            highlightSpan.textContent = hero.highlight;
            heroTitle.appendChild(highlightSpan);
            if (parts[1]) {
                heroTitle.appendChild(document.createTextNode(parts[1]));
            }
        } else {
            heroTitle.textContent = hero.title;
        }
    }

    if (heroDesc && hero.description) {
        heroDesc.textContent = hero.description;
    }
}

function renderPopularSkills(skills) {
    const skillGrid = document.querySelector('.skill-grid');
    if (!skillGrid) return;

    if (!Array.isArray(skills) || skills.length === 0) {
        renderEmptySkillsState();
        return;
    }

    // Clear existing static items safely
    skillGrid.textContent = '';

    skills.forEach(skill => {
        const article = document.createElement('article');
        article.className = 'skill-card';

        const body = document.createElement('div');
        body.className = 'skill-card-body';

        const meta = document.createElement('div');
        meta.className = 'skill-card-meta';

        const categoryBadge = document.createElement('span');
        categoryBadge.className = `category-badge ${skill.categoryClass || 'badge-programming'}`;
        categoryBadge.textContent = skill.category || 'Skill';

        const difficultyBadge = document.createElement('span');
        difficultyBadge.className = 'difficulty-badge';
        difficultyBadge.textContent = skill.difficulty || 'All Levels';

        meta.append(categoryBadge, difficultyBadge);

        const title = document.createElement('h3');
        title.className = 'skill-card-title';
        title.textContent = skill.title || '';

        const desc = document.createElement('p');
        desc.className = 'skill-card-desc';
        desc.textContent = skill.description || '';

        body.append(meta, title, desc);
        article.append(body);
        skillGrid.append(article);
    });
}

function renderHowItWorks(steps) {
    const stepsGrid = document.querySelector('.how-it-works .steps-grid');
    if (!stepsGrid || !Array.isArray(steps) || steps.length === 0) return;

    stepsGrid.textContent = '';

    steps.forEach(step => {
        const card = document.createElement('div');
        card.className = 'step-card';

        const header = document.createElement('div');
        header.className = 'step-card-header';

        const label = document.createElement('span');
        label.className = 'step-label';
        label.textContent = step.step;

        const icon = document.createElement('div');
        icon.className = `step-icon ${step.iconColor || 'blue'}`;
        icon.textContent = step.icon;

        header.append(label, icon);

        const heading = document.createElement('h3');
        heading.textContent = step.title;

        const desc = document.createElement('p');
        desc.textContent = step.description;

        card.append(header, heading, desc);
        stepsGrid.append(card);
    });
}

function renderBenefits(benefits) {
    // Select the benefits section's steps-grid
    const sections = document.querySelectorAll('.section.section-light');
    let benefitsGrid = null;
    sections.forEach(sec => {
        const title = sec.querySelector('.section-title');
        if (title && title.textContent.includes('Why SkillBridge')) {
            benefitsGrid = sec.querySelector('.steps-grid');
        }
    });

    if (!benefitsGrid || !Array.isArray(benefits) || benefits.length === 0) return;

    benefitsGrid.textContent = '';

    benefits.forEach(item => {
        const card = document.createElement('div');
        card.className = 'step-card';

        const header = document.createElement('div');
        header.className = 'step-card-header';

        const label = document.createElement('span');
        label.className = 'step-label';
        label.textContent = item.label || 'Benefit';

        const icon = document.createElement('div');
        icon.className = `step-icon ${item.iconColor || 'blue'}`;
        icon.textContent = item.icon;

        header.append(label, icon);

        const heading = document.createElement('h3');
        heading.textContent = item.title;

        const desc = document.createElement('p');
        desc.textContent = item.description;

        card.append(header, heading, desc);
        benefitsGrid.append(card);
    });
}

function renderEmptySkillsState() {
    const skillGrid = document.querySelector('.skill-grid');
    if (!skillGrid) return;
    skillGrid.textContent = '';

    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-state';
    emptyBox.style.gridColumn = '1 / -1';
    emptyBox.style.padding = '2rem';
    emptyBox.style.textAlign = 'center';
    emptyBox.style.color = 'var(--text-secondary, #6b7280)';
    emptyBox.textContent = 'No popular skills currently available.';
    skillGrid.append(emptyBox);
}

function renderErrorState(errorMessage) {
    const skillGrid = document.querySelector('.skill-grid');
    if (!skillGrid) return;

    const errorBox = document.createElement('div');
    errorBox.className = 'error-state';
    errorBox.style.gridColumn = '1 / -1';
    errorBox.style.padding = '1.5rem';
    errorBox.style.textAlign = 'center';
    errorBox.style.color = '#dc2626';
    errorBox.style.backgroundColor = '#fef2f2';
    errorBox.style.borderRadius = '8px';
    errorBox.style.border = '1px solid #fee2e2';

    const p = document.createElement('p');
    p.textContent = `Unable to load content: ${errorMessage}. Please try refreshing the page.`;
    errorBox.append(p);

    // Keep existing content if present, or show error message
    if (skillGrid.children.length === 0) {
        skillGrid.append(errorBox);
    }
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

