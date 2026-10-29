/**
 * SkillBridge - Login Page Logic
 * Dedicated JavaScript file for login.html
 * Fetches data strictly from data/login.json
 */

document.addEventListener('DOMContentLoaded', () => {
    loadLoginData();
});

async function loadLoginData() {
    const card = document.querySelector('.login-card');
    if (card) {
        card.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/login.json');
        if (!response.ok) {
            throw new Error(`Failed to load login config: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Apply configuration to DOM elements
        applyLoginConfig(data);
        setupLoginFormValidation();

    } catch (error) {
        console.error('Error loading login data:', error);
        renderErrorState(error.message);
    } finally {
        if (card) {
            card.removeAttribute('aria-busy');
        }
    }
}

function applyLoginConfig(data) {
    if (!data || !data.card) return;
    const cardData = data.card;

    const titleEl = document.querySelector('.login-title');
    const subtitleEl = document.querySelector('.login-subtitle');
    const brandTextEl = document.querySelector('.login-brand .logo-text');

    if (titleEl && cardData.title) titleEl.textContent = cardData.title;
    if (subtitleEl && cardData.subtitle) subtitleEl.textContent = cardData.subtitle;
    if (brandTextEl && cardData.brand && cardData.brand.text) brandTextEl.textContent = cardData.brand.text;

    // Configure fields
    if (Array.isArray(cardData.fields)) {
        cardData.fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                if (field.placeholder) input.placeholder = field.placeholder;
                if (field.required) input.required = true;

                // Update corresponding label text
                const label = document.querySelector(`label[for="${field.id}"]`);
                if (label && field.label) {
                    label.textContent = field.label;
                }
            }
        });
    }

    // Configure submit button
    const submitBtn = document.querySelector('.form-btn');
    if (submitBtn && cardData.submitButton && cardData.submitButton.text) {
        submitBtn.textContent = cardData.submitButton.text;
    }

    // Configure footer
    const footerNote = document.querySelector('.login-footer-note');
    if (footerNote && cardData.footer) {
        footerNote.textContent = '';
        footerNote.append(document.createTextNode(`${cardData.footer.prompt || "Don't have an account?"} `));

        const link = document.createElement('a');
        link.className = 'signup-link';
        link.href = cardData.footer.linkHref || 'signup.html';
        link.textContent = cardData.footer.linkText || 'Create Account';
        footerNote.append(link);
    }
}

function setupLoginFormValidation() {
    const form = document.querySelector('.login-card form');
    const submitLink = document.querySelector('.login-card .form-btn');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    if (!form || !submitLink || !emailInput || !passwordInput) return;

    // Convert link to button behavior or intercept click
    submitLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearMessages();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email) {
            showFeedback('Please enter your email address.', 'error');
            emailInput.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFeedback('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        if (!password) {
            showFeedback('Please enter your password.', 'error');
            passwordInput.focus();
            return;
        }

        if (password.length < 6) {
            showFeedback('Password must be at least 6 characters long.', 'error');
            passwordInput.focus();
            return;
        }

        // Success state simulation
        showFeedback('Signing in...', 'success');
        submitLink.textContent = 'Signing In...';
        submitLink.style.pointerEvents = 'none';
        submitLink.style.opacity = '0.7';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);
    });
}

function showFeedback(message, type) {
    clearMessages();
    const form = document.querySelector('.login-card form');
    if (!form) return;

    const banner = document.createElement('div');
    banner.className = `feedback-banner feedback-${type}`;
    banner.style.padding = '0.75rem 1rem';
    banner.style.marginBottom = '1.25rem';
    banner.style.borderRadius = '6px';
    banner.style.fontSize = '0.875rem';
    banner.style.textAlign = 'center';

    if (type === 'error') {
        banner.style.backgroundColor = '#fef2f2';
        banner.style.color = '#dc2626';
        banner.style.border = '1px solid #fee2e2';
    } else {
        banner.style.backgroundColor = '#f0fdf4';
        banner.style.color = '#16a34a';
        banner.style.border = '1px solid #dcfce7';
    }

    banner.textContent = message;
    form.prepend(banner);
}

function clearMessages() {
    const banners = document.querySelectorAll('.feedback-banner');
    banners.forEach(b => b.remove());
}

function renderErrorState(errorMessage) {
    showFeedback(`Failed to load form configuration: ${errorMessage}`, 'error');
}

