/**
 * SkillBridge - Sign Up Page Logic
 * Dedicated JavaScript file for signup.html
 * Fetches data strictly from data/signup.json
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSignupData();
});

async function loadSignupData() {
    const card = document.querySelector('.signup-card');
    if (card) {
        card.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/signup.json');
        if (!response.ok) {
            throw new Error(`Failed to load signup config: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Apply configuration to elements
        applySignupConfig(data);
        setupSignupFormValidation();

    } catch (error) {
        console.error('Error loading signup data:', error);
        renderErrorState(error.message);
    } finally {
        if (card) {
            card.removeAttribute('aria-busy');
        }
    }
}

function applySignupConfig(data) {
    if (!data || !data.card) return;
    const cardData = data.card;

    const titleEl = document.querySelector('.signup-title');
    const subtitleEl = document.querySelector('.signup-subtitle');
    const brandText = document.querySelector('.signup-brand .brand-text');

    if (titleEl && cardData.title) titleEl.textContent = cardData.title;
    if (subtitleEl && cardData.subtitle) subtitleEl.textContent = cardData.subtitle;
    if (brandText && cardData.brand && cardData.brand.text) brandText.textContent = cardData.brand.text;

    // Populate select fields & inputs
    if (Array.isArray(cardData.fields)) {
        cardData.fields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;

            if (field.placeholder) el.placeholder = field.placeholder;
            if (field.required) el.required = true;

            // Configure select options if defined in JSON
            if (el.tagName.toLowerCase() === 'select' && Array.isArray(field.options)) {
                el.textContent = '';
                const defaultOpt = document.createElement('option');
                defaultOpt.value = '';
                defaultOpt.textContent = field.defaultOption || 'Select...';
                el.append(defaultOpt);

                field.options.forEach(optText => {
                    const opt = document.createElement('option');
                    opt.value = optText;
                    opt.textContent = optText;
                    el.append(opt);
                });
            }

            // Update label
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && field.label) {
                label.textContent = field.label;
            }
        });
    }

    // Submit button
    const submitBtn = document.querySelector('.form-btn');
    if (submitBtn && cardData.submitButton && cardData.submitButton.text) {
        submitBtn.textContent = cardData.submitButton.text;
    }

    // Terms
    const termsEl = document.querySelector('.signup-terms');
    if (termsEl && cardData.terms) {
        termsEl.textContent = cardData.terms;
    }

    // Footer
    const footerNote = document.querySelector('.signup-footer-note');
    if (footerNote && cardData.footer) {
        footerNote.textContent = '';
        footerNote.append(document.createTextNode(`${cardData.footer.prompt || 'Already have an account?'} `));

        const link = document.createElement('a');
        link.className = 'signin-link';
        link.href = cardData.footer.linkHref || 'login.html';
        link.textContent = cardData.footer.linkText || 'Sign In →';
        footerNote.append(link);
    }
}

function setupSignupFormValidation() {
    const form = document.querySelector('.signup-card form');
    const submitLink = document.querySelector('.signup-card .form-btn');

    const firstName = document.getElementById('signup-firstname');
    const lastName = document.getElementById('signup-lastname');
    const email = document.getElementById('signup-email');
    const dept = document.getElementById('signup-department');
    const year = document.getElementById('signup-year');
    const password = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('signup-confirm');

    if (!form || !submitLink) return;

    submitLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearMessages();

        if (firstName && !firstName.value.trim()) {
            showFeedback('Please enter your first name.', 'error');
            firstName.focus();
            return;
        }

        if (lastName && !lastName.value.trim()) {
            showFeedback('Please enter your last name.', 'error');
            lastName.focus();
            return;
        }

        if (email) {
            const emailVal = email.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailVal || !emailRegex.test(emailVal)) {
                showFeedback('Please enter a valid college email address.', 'error');
                email.focus();
                return;
            }
        }

        if (dept && !dept.value) {
            showFeedback('Please select your department.', 'error');
            dept.focus();
            return;
        }

        if (year && !year.value) {
            showFeedback('Please select your year / semester.', 'error');
            year.focus();
            return;
        }

        if (password) {
            if (!password.value) {
                showFeedback('Please create a password.', 'error');
                password.focus();
                return;
            }
            if (password.value.length < 6) {
                showFeedback('Password must be at least 6 characters long.', 'error');
                password.focus();
                return;
            }
        }

        if (confirmPassword) {
            if (!confirmPassword.value) {
                showFeedback('Please confirm your password.', 'error');
                confirmPassword.focus();
                return;
            }
            if (password && password.value !== confirmPassword.value) {
                showFeedback('Passwords do not match. Please verify.', 'error');
                confirmPassword.focus();
                return;
            }
        }

        // Success simulation
        showFeedback('Account created successfully! Redirecting...', 'success');
        submitLink.textContent = 'Creating Account...';
        submitLink.style.pointerEvents = 'none';
        submitLink.style.opacity = '0.7';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    });
}

function showFeedback(message, type) {
    clearMessages();
    const form = document.querySelector('.signup-card form');
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
    showFeedback(`Failed to load signup configuration: ${errorMessage}`, 'error');
}

