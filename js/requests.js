/**
 * Learning Requests page: the JSON file supplies page copy; request records
 * and status always come from the shared browser storage layer.
 */

let allRequests = [];
let activeTab = 'All Requests';
let requestSearch = '';

document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('.request-table tbody');
    if (tbody) tbody.textContent = '';
    setupTabFilters();

    const searchInput = document.getElementById('request-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            requestSearch = searchInput.value.trim().toLowerCase();
            refreshRequests();
        });
    }

    if (window.location.protocol === 'file:') {
        showFileProtocolBanner();
        refreshRequests();
        sbOnStorageChange(key => {
            if (key === SB_KEYS.REQUESTS || key === SB_KEYS.MENTORS) refreshRequests();
        });
        sbOnPageActive(refreshRequests);
        return;
    }

    loadRequestsData();
    sbOnStorageChange(key => {
        if (key === SB_KEYS.REQUESTS || key === SB_KEYS.MENTORS) refreshRequests();
    });
    sbOnPageActive(refreshRequests);
});

async function loadRequestsData() {
    try {
        const response = await fetch('data/requests.json');
        if (!response.ok) throw new Error(`Failed to load requests page configuration: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.pageHeader) {
            const title = document.querySelector('.page-title');
            const subtitle = document.querySelector('.page-subtitle');
            if (title && data.pageHeader.title) title.textContent = data.pageHeader.title;
            if (subtitle && data.pageHeader.subtitle) subtitle.textContent = data.pageHeader.subtitle;
        }
    } catch (error) {
        console.error('Unable to load requests page configuration:', error);
    }

    try {
        await sbLoadMentors();
    } catch (error) {
        console.error('Unable to load mentor details for requests:', error);
    }
    refreshRequests();
}

function setupTabFilters() {
    document.querySelectorAll('.tab-pills .tab-pill').forEach(pill => {
        pill.addEventListener('click', event => {
            event.preventDefault();
            document.querySelectorAll('.tab-pills .tab-pill').forEach(tab => tab.classList.remove('active'));
            pill.classList.add('active');
            activeTab = pill.textContent.trim();
            refreshRequests();
        });
    });
}

function refreshRequests() {
    const user = sbGetCurrentUser();
    allRequests = user ? sbGetRequests({ studentId: user.id }) : [];
    updateSummaryCounters(allRequests);
    renderAuthNotice(Boolean(user));
    renderTableRows(filterRequests());
}

function updateSummaryCounters(requests) {
    const counts = sbGetRequestCounts(requests);
    document.querySelectorAll('.summary-grid .summary-card').forEach(card => {
        const label = card.querySelector('.summary-label');
        const number = card.querySelector('.summary-number');
        if (!label || !number) return;
        const key = label.textContent.trim().toLowerCase();
        number.textContent = String(counts[key] || 0);
    });
}

function filterRequests() {
    return allRequests.filter(request => {
        const matchesTab = activeTab === 'All Requests' || activeTab === 'All' ||
            request.status.toLowerCase() === activeTab.toLowerCase();
        const mentorName = request.mentorName || '';
        const matchesSearch = !requestSearch ||
            request.skillName.toLowerCase().includes(requestSearch) ||
            mentorName.toLowerCase().includes(requestSearch) ||
            request.description.toLowerCase().includes(requestSearch);
        return matchesTab && matchesSearch;
    });
}

function renderTableRows(requests) {
    const tbody = document.querySelector('.request-table tbody');
    if (!tbody) return;
    tbody.textContent = '';
    tbody.hidden = false;

    if (requests.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'request-empty-cell';
        cell.textContent = sbGetCurrentUser()
            ? `No requests found for "${activeTab}". Submit a request from Explore or Skill Details to get started.`
            : 'Sign in to see the learning requests you have submitted.';
        row.append(cell);
        tbody.append(row);
        return;
    }

    const mentors = sbGetMentors();
    requests.forEach(request => {
        const mentor = mentors.find(item => item.name === request.mentorName);
        const row = document.createElement('tr');

        const partnerCell = document.createElement('td');
        const partnerInfo = document.createElement('div');
        partnerInfo.className = 'partner-info';
        const avatar = document.createElement('div');
        avatar.className = 'partner-avatar-placeholder';
        if (mentor?.avatar?.bgColor) avatar.style.backgroundColor = mentor.avatar.bgColor;
        if (mentor?.avatarBg) avatar.style.backgroundColor = mentor.avatarBg;
        avatar.textContent = mentor?.avatar?.text || mentor?.initials || (request.mentorName || '—').slice(0, 2).toUpperCase();
        const partnerDetails = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'partner-name';
        name.textContent = request.mentorName || 'Awaiting mentor';
        const department = document.createElement('div');
        department.className = 'partner-dept';
        department.textContent = mentor?.department || '';
        partnerDetails.append(name, department);
        partnerInfo.append(avatar, partnerDetails);
        partnerCell.append(partnerInfo);

        const exchangeCell = document.createElement('td');
        const exchange = document.createElement('div');
        exchange.className = 'exchange-info';
        const label = document.createTextNode('Learning: ');
        const skill = document.createElement('span');
        skill.className = 'learn-link';
        skill.textContent = request.skillName;
        exchange.append(label, skill);
        if (request.description) {
            const description = document.createElement('p');
            description.className = 'request-description';
            description.textContent = request.description;
            exchange.append(description);
        }
        exchangeCell.append(exchange);

        const dateCell = document.createElement('td');
        const createdAt = new Date(request.createdAt);
        dateCell.textContent = Number.isNaN(createdAt.getTime()) ? '—' :
            createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status-badge ${getStatusClass(request.status)}`;
        badge.textContent = request.status;
        statusCell.append(badge);

        const actionsCell = document.createElement('td');
        actionsCell.textContent = request.status === 'Pending' ? 'Awaiting mentor response' : 'Managed by mentor';
        row.append(partnerCell, exchangeCell, dateCell, statusCell, actionsCell);
        tbody.append(row);
    });
}

function getStatusClass(status) {
    const classes = {
        Pending: 'status-pending',
        Accepted: 'status-confirmed',
        Rejected: 'status-declined',
        Completed: 'status-completed',
    };
    return classes[status] || '';
}

function renderAuthNotice(isSignedIn) {
    let notice = document.getElementById('requests-auth-notice');
    if (isSignedIn) {
        notice?.remove();
        return;
    }
    if (notice) return;

    notice = document.createElement('p');
    notice.id = 'requests-auth-notice';
    notice.className = 'requests-auth-notice';
    notice.textContent = 'Your request list is private to your signed-in account. ';
    const link = document.createElement('a');
    link.href = 'login.html';
    link.textContent = 'Sign in';
    notice.append(link);
    document.querySelector('.request-controls .container')?.append(notice);
}

function showFileProtocolBanner() {
    if (document.getElementById('file-protocol-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'file-protocol-banner';
    banner.setAttribute('role', 'status');
    banner.textContent = 'For JSON data, use a local server such as VS Code Live Server.';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px 20px;background:#1e40af;color:#fff;text-align:center;font:14px Inter,sans-serif;';
    document.body.prepend(banner);
    document.body.style.paddingTop = '44px';
}
