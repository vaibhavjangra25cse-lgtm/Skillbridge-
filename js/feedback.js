/**
 * SkillBridge - Feedback Page Logic
 * Dedicated JavaScript file for feedback.html
 * Fetches data strictly from data/feedback.json
 */

document.addEventListener('DOMContentLoaded', () => {
    loadFeedbackData();
});

let feedbackConfig = null;
let isSubmitting = false;

async function loadFeedbackData() {
    const card = document.querySelector('.feedback-card');
    if (card) {
        card.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/feedback.json');
        if (!response.ok) {
            throw new Error(`Failed to load feedback configuration: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        feedbackConfig = data;

        // Apply configuration and labels from JSON
        applyFeedbackConfig(data);

        // Bind form interactions and validations
        setupFormInteractions();

    } catch (error) {
        console.error('Error loading feedback data:', error);
        renderConfigError(error.message);
    } finally {
        if (card) {
            card.removeAttribute('aria-busy');
        }
    }
}

function applyFeedbackConfig(data) {
    if (!data) return;

    // Header
    if (data.pageHeader) {
        const titleEl = document.getElementById('page-title');
        const subtitleEl = document.getElementById('page-subtitle');
        if (titleEl && data.pageHeader.title) titleEl.textContent = data.pageHeader.title;
        if (subtitleEl && data.pageHeader.subtitle) subtitleEl.textContent = data.pageHeader.subtitle;
    }

    if (!data.form || !data.form.fields) return;
    const fields = data.form.fields;

    // Category dropdown options
    const categorySelect = document.getElementById('feedback-category');
    if (categorySelect && fields.category) {
        categorySelect.textContent = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = fields.category.defaultOption || 'Select a category';
        categorySelect.append(defaultOption);

        if (Array.isArray(fields.category.options)) {
            fields.category.options.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                categorySelect.append(opt);
            });
        }
    }

    // Placeholders and labels
    if (fields.name) {
        const input = document.getElementById('feedback-name');
        if (input && fields.name.placeholder) input.placeholder = fields.name.placeholder;
    }

    if (fields.email) {
        const input = document.getElementById('feedback-email');
        if (input && fields.email.placeholder) input.placeholder = fields.email.placeholder;
    }

    if (fields.like) {
        const input = document.getElementById('feedback-like');
        if (input && fields.like.placeholder) input.placeholder = fields.like.placeholder;
    }

    if (fields.improve) {
        const input = document.getElementById('feedback-improve');
        if (input && fields.improve.placeholder) input.placeholder = fields.improve.placeholder;
    }

    if (fields.comments) {
        const input = document.getElementById('feedback-comments');
        if (input && fields.comments.placeholder) input.placeholder = fields.comments.placeholder;
    }

    // Recommendation options
    const recContainer = document.getElementById('recommendation-options');
    if (recContainer && fields.recommendation && Array.isArray(fields.recommendation.options)) {
        recContainer.textContent = '';
        fields.recommendation.options.forEach(item => {
            const label = document.createElement('label');
            label.className = 'recommend-option';
            label.htmlFor = `recommend-${item.value.toLowerCase()}`;

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = `recommend-${item.value.toLowerCase()}`;
            radio.name = 'recommendation';
            radio.value = item.value;

            const textSpan = document.createElement('span');
            textSpan.textContent = item.label;

            label.append(radio, textSpan);
            recContainer.append(label);
        });
    }

    // Buttons
    if (data.form.buttons) {
        const submitBtn = document.getElementById('btn-submit-feedback');
        const resetBtn = document.getElementById('btn-reset-feedback');
        if (submitBtn && data.form.buttons.submit) submitBtn.textContent = data.form.buttons.submit;
        if (resetBtn && data.form.buttons.reset) resetBtn.textContent = data.form.buttons.reset;
    }
}

function setupFormInteractions() {
    const form = document.getElementById('feedback-form');
    const resetBtn = document.getElementById('btn-reset-feedback');
    const starRadios = document.querySelectorAll('.star-rating input[type="radio"]');
    const ratingDesc = document.getElementById('rating-desc');

    // Rating star change listener
    starRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            clearFieldError('rating');
            updateRatingDescription(radio.value);
        });
    });

    // Rating star hover feedback
    const starLabels = document.querySelectorAll('.star-rating label');
    starLabels.forEach(label => {
        label.addEventListener('mouseenter', () => {
            const forId = label.getAttribute('for');
            const radio = document.getElementById(forId);
            if (radio && radio.value) {
                updateRatingDescription(radio.value, true);
            }
        });
    });

    const starContainer = document.querySelector('.star-rating');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            const checkedRadio = document.querySelector('.star-rating input[type="radio"]:checked');
            if (checkedRadio) {
                updateRatingDescription(checkedRadio.value);
            } else {
                if (ratingDesc) ratingDesc.textContent = 'Select a rating';
            }
        });
    }

    // Recommendation radio styling
    const recOptions = document.querySelectorAll('.recommend-option input[type="radio"]');
    recOptions.forEach(r => {
        r.addEventListener('change', () => {
            document.querySelectorAll('.recommend-option').forEach(opt => opt.classList.remove('selected'));
            if (r.checked && r.parentElement) {
                r.parentElement.classList.add('selected');
            }
        });
    });

    // Clear individual errors on input
    bindInputErrorClearing('feedback-name', 'name');
    bindInputErrorClearing('feedback-email', 'email');
    bindInputErrorClearing('feedback-category', 'category');
    bindInputErrorClearing('feedback-improve', 'improve');

    // Reset button handler
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetForm);
    }

    // Form submit handler
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function updateRatingDescription(val, isHover = false) {
    const ratingDesc = document.getElementById('rating-desc');
    if (!ratingDesc) return;

    if (feedbackConfig && feedbackConfig.form && feedbackConfig.form.fields &&
        feedbackConfig.form.fields.rating && feedbackConfig.form.fields.rating.descriptions) {
        const desc = feedbackConfig.form.fields.rating.descriptions[val];
        if (desc) {
            ratingDesc.textContent = isHover ? `${desc} (Click to rate)` : desc;
            return;
        }
    }

    ratingDesc.textContent = `${val} Star${val > 1 ? 's' : ''}`;
}

function bindInputErrorClearing(inputId, errorKey) {
    const el = document.getElementById(inputId);
    if (!el) return;

    const eventType = el.tagName.toLowerCase() === 'select' ? 'change' : 'input';
    el.addEventListener(eventType, () => {
        clearFieldError(errorKey);
    });
}

function clearFieldError(key) {
    const errorEl = document.getElementById(`error-${key}`);
    if (errorEl) {
        errorEl.textContent = '';
    }

    let inputEl = null;
    if (key === 'name') inputEl = document.getElementById('feedback-name');
    else if (key === 'email') inputEl = document.getElementById('feedback-email');
    else if (key === 'category') inputEl = document.getElementById('feedback-category');
    else if (key === 'improve') inputEl = document.getElementById('feedback-improve');

    if (inputEl) {
        inputEl.classList.remove('has-error');
    }
}

function setFieldError(key, message) {
    const errorEl = document.getElementById(`error-${key}`);
    if (errorEl) {
        errorEl.textContent = message;
    }

    let inputEl = null;
    if (key === 'name') inputEl = document.getElementById('feedback-name');
    else if (key === 'email') inputEl = document.getElementById('feedback-email');
    else if (key === 'category') inputEl = document.getElementById('feedback-category');
    else if (key === 'improve') inputEl = document.getElementById('feedback-improve');

    if (inputEl) {
        inputEl.classList.add('has-error');
    }
}

function clearAllErrors() {
    ['name', 'email', 'category', 'rating', 'improve'].forEach(key => clearFieldError(key));
}

function validateFeedbackForm() {
    clearAllErrors();
    let isValid = true;
    let firstInvalidElement = null;

    const messages = feedbackConfig && feedbackConfig.form && feedbackConfig.form.messages &&
        feedbackConfig.form.messages.errors ? feedbackConfig.form.messages.errors : {};

    // 1. Full Name (Required)
    const nameInput = document.getElementById('feedback-name');
    if (!nameInput || !nameInput.value.trim()) {
        setFieldError('name', messages.nameRequired || 'Please enter your full name.');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = nameInput;
    }

    // 2. Email Address (Required + validation)
    const emailInput = document.getElementById('feedback-email');
    const emailVal = emailInput ? emailInput.value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailVal) {
        setFieldError('email', messages.emailRequired || 'Please enter your email address.');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = emailInput;
    } else if (!emailRegex.test(emailVal)) {
        setFieldError('email', messages.emailInvalid || 'Please enter a valid email address (e.g. name@college.edu).');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = emailInput;
    }

    // 3. Feedback Category (Required)
    const categorySelect = document.getElementById('feedback-category');
    if (!categorySelect || !categorySelect.value) {
        setFieldError('category', messages.categoryRequired || 'Please select a feedback category.');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = categorySelect;
    }

    // 4. Overall Rating (Required: 1 to 5)
    const selectedRating = document.querySelector('.star-rating input[type="radio"]:checked');
    if (!selectedRating) {
        setFieldError('rating', messages.ratingRequired || 'Please select an overall rating (1 to 5 stars).');
        isValid = false;
        if (!firstInvalidElement) {
            firstInvalidElement = document.querySelector('.star-rating label');
        }
    }

    // 6. What should we improve? (Required)
    const improveInput = document.getElementById('feedback-improve');
    if (!improveInput || !improveInput.value.trim()) {
        setFieldError('improve', messages.improveRequired || 'Please share what we should improve.');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = improveInput;
    }

    if (firstInvalidElement && typeof firstInvalidElement.focus === 'function') {
        firstInvalidElement.focus();
    }

    return isValid;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Prevent duplicate submissions while in progress
    if (isSubmitting) return;

    // Perform full client-side validation
    const isValid = validateFeedbackForm();

    if (!isValid) {
        const errorMsg = (feedbackConfig && feedbackConfig.form && feedbackConfig.form.messages &&
            feedbackConfig.form.messages.validationError) || 'Please correct the errors in the form before submitting.';
        showAlert('error', 'Validation Incomplete', errorMsg);
        return;
    }

    // Form is valid. Begin async submission process
    isSubmitting = true;
    const submitBtn = document.getElementById('btn-submit-feedback');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit Feedback';

    if (submitBtn) {
        submitBtn.disabled = true;
        const processingText = (feedbackConfig && feedbackConfig.form && feedbackConfig.form.buttons &&
            feedbackConfig.form.buttons.submitProcessing) || 'Submitting...';
        submitBtn.textContent = processingText;
    }

    // Clear any previous error banner
    clearAlert();

    try {
        // Simulate realistic frontend async processing
        await new Promise(resolve => setTimeout(resolve, 600));

        // NOTICE: SkillBridge is a static frontend project with no backend server.
        // As strictly required: we do NOT pretend it was saved to a database,
        // and we do NOT silently discard it while showing a false server success message.
        // We clearly inform the user with a Frontend Demonstration Notice,
        // and do not persist private feedback on the client or in JSON files.

        const noticeTitle = (feedbackConfig && feedbackConfig.form && feedbackConfig.form.messages &&
            feedbackConfig.form.messages.demoNoticeTitle) || 'Frontend Demonstration Only';

        const noticeBody = (feedbackConfig && feedbackConfig.form && feedbackConfig.form.messages &&
            feedbackConfig.form.messages.demoNoticeBody) ||
            'Form validation passed! SkillBridge currently runs as a frontend static application with no backend server or database connected. Your feedback was validated successfully on the client side, but has not been sent or stored anywhere.';

        showAlert('demo-success', noticeTitle, noticeBody);

        // Scroll to top of the card smoothly
        const alertArea = document.getElementById('feedback-alert-container');
        if (alertArea) {
            alertArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

    } catch (err) {
        console.error('Submission processing error:', err);
        showAlert('error', 'Submission Error', 'An unexpected error occurred while processing the form. Please try again.');
    } finally {
        isSubmitting = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

function handleResetForm() {
    const form = document.getElementById('feedback-form');
    if (!form) return;

    form.reset();
    clearAllErrors();
    clearAlert();

    // Reset star rating description
    const ratingDesc = document.getElementById('rating-desc');
    if (ratingDesc) {
        ratingDesc.textContent = 'Select a rating';
    }

    // Reset recommendation selected styling
    document.querySelectorAll('.recommend-option').forEach(opt => opt.classList.remove('selected'));

    // Reset submit button state
    const submitBtn = document.getElementById('btn-submit-feedback');
    if (submitBtn) {
        submitBtn.disabled = false;
        const defaultText = (feedbackConfig && feedbackConfig.form && feedbackConfig.form.buttons &&
            feedbackConfig.form.buttons.submit) || 'Submit Feedback';
        submitBtn.textContent = defaultText;
    }

    // Temporary info notice
    const resetMsg = (feedbackConfig && feedbackConfig.form && feedbackConfig.form.messages &&
        feedbackConfig.form.messages.resetConfirm) || 'Form fields have been reset to their default state.';
    showAlert('info', 'Form Reset', resetMsg);
}

function showAlert(type, title, message) {
    const container = document.getElementById('feedback-alert-container');
    if (!container) return;

    container.textContent = '';

    const banner = document.createElement('div');
    banner.className = `feedback-banner ${type}`;

    const icon = document.createElement('span');
    icon.className = 'feedback-icon';
    if (type === 'error') {
        icon.textContent = '⚠️';
    } else if (type === 'demo-success') {
        icon.textContent = 'ℹ️';
    } else {
        icon.textContent = 'ℹ️';
    }

    const contentDiv = document.createElement('div');

    const titleEl = document.createElement('div');
    titleEl.className = 'feedback-banner-title';
    titleEl.textContent = title;

    const bodyEl = document.createElement('div');
    bodyEl.className = 'feedback-banner-body';
    bodyEl.textContent = message;

    contentDiv.append(titleEl, bodyEl);
    banner.append(icon, contentDiv);
    container.append(banner);
}

function clearAlert() {
    const container = document.getElementById('feedback-alert-container');
    if (container) {
        container.textContent = '';
    }
}

function renderConfigError(errorMessage) {
    showAlert('error', 'Configuration Load Error', `Failed to load feedback configuration: ${errorMessage}. Default values are in use.`);
}
