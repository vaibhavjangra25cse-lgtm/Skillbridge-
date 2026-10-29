/**
 * SkillBridge - Learning Requests Logic
 * Dedicated JavaScript file for requests.html
 * Fetches data strictly from data/requests.json
 */

document.addEventListener('DOMContentLoaded', () => {
    loadRequestsData();
});

let allRequests = [];
let activeTab = 'All Requests';

async function loadRequestsData() {
    const tableBody = document.querySelector('.request-table tbody');
    if (tableBody) {
        tableBody.setAttribute('aria-busy', 'true');
    }

    try {
        const response = await fetch('data/requests.json');
        if (!response.ok) {
            throw new Error(`Failed to load requests data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Update page title & subtitle
        if (data.pageHeader) {
            const pageTitle = document.querySelector('.page-title');
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageTitle && data.pageHeader.title) pageTitle.textContent = data.pageHeader.title;
            if (pageSubtitle && data.pageHeader.subtitle) pageSubtitle.textContent = data.pageHeader.subtitle;
        }

        allRequests = Array.isArray(data.requests) ? data.requests : [];

        // Render summary counters
        updateSummaryCounters(data.summary);

        // Setup filter tabs
        setupTabFilters();

        // Render request rows
        renderTableRows(filterRequests());

    } catch (error) {
        console.error('Error loading requests data:', error);
        renderErrorState(error.message);
    } finally {
        if (tableBody) {
            tableBody.removeAttribute('aria-busy');
        }
    }
}

function updateSummaryCounters(summary) {
    const cards = document.querySelectorAll('.summary-grid .summary-card');
    if (!cards || cards.length === 0) return;

    // Recalculate directly from current records if summary is omitted or dynamically changing
    let counts = {
        pending: 0,
        accepted: 0,
        completed: 0,
        declined: 0
    };

    if (summary) {
        counts = { ...summary };
    } else {
        allRequests.forEach(r => {
            const st = r.status.toLowerCase();
            if (counts[st] !== undefined) {
                counts[st]++;
            }
        });
    }

    cards.forEach(card => {
        const label = card.querySelector('.summary-label');
        const num = card.querySelector('.summary-number');
        if (label && num) {
            const key = label.textContent.trim().toLowerCase();
            if (counts[key] !== undefined) {
                num.textContent = counts[key];
            }
        }
    });
}

function setupTabFilters() {
    const tabPills = document.querySelectorAll('.tab-pills .tab-pill');
    tabPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            tabPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeTab = pill.textContent.trim();
            renderTableRows(filterRequests());
        });
    });
}

function filterRequests() {
    if (activeTab === 'All Requests' || activeTab === 'All') {
        return allRequests;
    }
    return allRequests.filter(req => req.status.toLowerCase() === activeTab.toLowerCase());
}

function renderTableRows(requests) {
    const tbody = document.querySelector('.request-table tbody');
    if (!tbody) return;

    tbody.textContent = '';

    if (!requests || requests.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '2.5rem 1rem';
        emptyCell.style.color = '#64748b';
        emptyCell.style.fontSize = '1rem';
        emptyCell.textContent = `No requests found for "${activeTab}".`;
        emptyRow.append(emptyCell);
        tbody.append(emptyRow);
        return;
    }

    requests.forEach(req => {
        const tr = document.createElement('tr');

        // Column 1: Partner
        const tdPartner = document.createElement('td');
        const partnerInfo = document.createElement('div');
        partnerInfo.className = 'partner-info';

        const avatar = document.createElement('div');
        avatar.className = 'partner-avatar-placeholder';
        if (req.partner.avatarBg) {
            avatar.style.backgroundColor = req.partner.avatarBg;
        }
        avatar.textContent = req.partner.avatarInitials || req.partner.name.slice(0, 2).toUpperCase();

        const partnerDetails = document.createElement('div');
        const partnerName = document.createElement('div');
        partnerName.className = 'partner-name';
        partnerName.textContent = req.partner.name;

        const partnerDept = document.createElement('div');
        partnerDept.className = 'partner-dept';
        partnerDept.textContent = req.partner.department;

        partnerDetails.append(partnerName, partnerDept);
        partnerInfo.append(avatar, partnerDetails);
        tdPartner.append(partnerInfo);

        // Column 2: Skill Exchange
        const tdExchange = document.createElement('td');
        const exchangeInfo = document.createElement('div');
        exchangeInfo.className = 'exchange-info';

        const teachText = document.createTextNode('Teaching: ');
        const teachSpan = document.createElement('span');
        teachSpan.className = 'teach-link';
        teachSpan.textContent = req.exchange.teaching;

        const br = document.createElement('br');

        const learnText = document.createTextNode('Learning: ');
        const learnSpan = document.createElement('span');
        learnSpan.className = 'learn-link';
        learnSpan.textContent = req.exchange.learning;

        exchangeInfo.append(teachText, teachSpan, br, learnText, learnSpan);
        tdExchange.append(exchangeInfo);

        // Column 3: Date
        const tdDate = document.createElement('td');
        tdDate.textContent = req.date;

        // Column 4: Status
        const tdStatus = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${req.statusClass || getStatusClass(req.status)}`;
        statusBadge.textContent = req.status;
        tdStatus.append(statusBadge);

        // Column 5: Actions
        const tdActions = document.createElement('td');
        renderActionButtons(tdActions, req, statusBadge);

        tr.append(tdPartner, tdExchange, tdDate, tdStatus, tdActions);
        tbody.append(tr);
    });
}

function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s === 'pending') return 'status-pending';
    if (s === 'accepted') return 'status-confirmed';
    if (s === 'completed') return 'status-completed';
    if (s === 'declined') return 'status-declined';
    return '';
}

function renderActionButtons(tdActions, req, statusBadge) {
    tdActions.textContent = '';
    const s = req.status.toLowerCase();

    if (s === 'pending') {
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'action-btn accept';
        acceptBtn.textContent = 'Accept';
        acceptBtn.addEventListener('click', () => {
            req.status = 'Accepted';
            req.statusClass = 'status-confirmed';
            statusBadge.className = 'status-badge status-confirmed';
            statusBadge.textContent = 'Accepted';
            renderActionButtons(tdActions, req, statusBadge);
            updateSummaryCounters();
        });

        const chatBtn = document.createElement('button');
        chatBtn.className = 'action-btn chat';
        chatBtn.textContent = 'Message';
        chatBtn.addEventListener('click', () => {
            alert(`Opening chat with ${req.partner.name}`);
        });

        tdActions.append(acceptBtn, chatBtn);
    } else if (s === 'accepted') {
        const chatBtn = document.createElement('button');
        chatBtn.className = 'action-btn chat';
        chatBtn.textContent = 'Message';
        chatBtn.addEventListener('click', () => {
            alert(`Opening chat with ${req.partner.name}`);
        });
        tdActions.append(chatBtn);
    } else if (s === 'completed') {
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'action-text';
        reviewBtn.textContent = 'Leave Review';
        reviewBtn.addEventListener('click', () => {
            alert(`Leave review for ${req.partner.name}`);
        });
        tdActions.append(reviewBtn);
    } else if (s === 'declined') {
        const resendBtn = document.createElement('button');
        resendBtn.className = 'action-text';
        resendBtn.textContent = 'Resend';
        resendBtn.addEventListener('click', () => {
            req.status = 'Pending';
            req.statusClass = 'status-pending';
            statusBadge.className = 'status-badge status-pending';
            statusBadge.textContent = 'Pending';
            renderActionButtons(tdActions, req, statusBadge);
            updateSummaryCounters();
        });
        tdActions.append(resendBtn);
    }
}

function renderErrorState(errorMessage) {
    const tbody = document.querySelector('.request-table tbody');
    if (!tbody) return;

    tbody.textContent = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.textAlign = 'center';
    td.style.padding = '2rem';
    td.style.color = '#dc2626';
    td.textContent = `Error loading requests: ${errorMessage}. Please try refreshing.`;
    tr.append(td);
    tbody.append(tr);
}

