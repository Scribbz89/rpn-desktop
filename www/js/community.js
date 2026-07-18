const RPN_API = 'https://rpn-server.onrender.com';

function communityToken() {
    return localStorage.getItem('rpn_community_token');
}

function communityUser() {
    const u = localStorage.getItem('rpn_community_user');
    return u ? JSON.parse(u) : null;
}

function communityLogout() {
    localStorage.removeItem('rpn_community_token');
    localStorage.removeItem('rpn_community_user');
}

async function apiRequest(method, path, body, auth) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = 'Bearer ' + communityToken();
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    // 25s timeout to survive Render cold starts
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    opts.signal = controller.signal;

    let res;
    try {
        res = await fetch(RPN_API + path, opts);
    } catch(e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw new Error('Server is waking up — please try again in a moment');
        throw e;
    }
    clearTimeout(timer);

    // Session expired — only log out if this was an authenticated request
    if (res.status === 401 && auth) {
        communityLogout();
        if (!window.location.href.includes('community-auth')) {
            window.location.href = 'community-auth.html';
        }
        throw new Error('Session expired — please sign in again');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = data.detail;
        const msg = Array.isArray(detail)
            ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
            : (typeof detail === 'string' ? detail : 'Request failed');
        throw new Error(msg);
    }
    return data;
}

async function communityRegister(payload) {
    return apiRequest('POST', '/register', payload, false);
}

async function communityLogin(email, password) {
    const form = new URLSearchParams({ username: email, password });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let res;
    try {
        res = await fetch(RPN_API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
            signal: controller.signal,
        });
    } catch(e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw new Error('Server took too long — it may be waking up. Please try again in a moment.');
        throw new Error('Cannot reach server. Check your internet connection.');
    }
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('rpn_community_token', data.access_token);
    return data;
}

async function communityGetMe() {
    const data = await apiRequest('GET', '/me', null, true);
    localStorage.setItem('rpn_community_user', JSON.stringify(data));
    return data;
}

async function communityUpdateMe(payload) {
    const data = await apiRequest('PUT', '/me', payload, true);
    localStorage.setItem('rpn_community_user', JSON.stringify(data));
    return data;
}

async function communityGetMembers() {
    return apiRequest('GET', '/members', null, true);
}

async function communityGetPins() {
    return apiRequest('GET', '/pins', null, true);
}

async function communityCreatePin(payload) {
    return apiRequest('POST', '/pins', payload, true);
}

async function communityDeletePin(id) {
    return apiRequest('DELETE', '/pins/' + id, null, true);
}

async function communityGetContacts() {
    return apiRequest('GET', '/contacts', null, true);
}

async function communityAddContact(contactId) {
    return apiRequest('POST', '/contacts', { contact_id: contactId }, true);
}

async function communityRemoveContact(contactRowId) {
    return apiRequest('DELETE', '/contacts/' + contactRowId, null, true);
}

async function communityGetContactRequests() {
    return apiRequest('GET', '/contact-requests', null, true);
}

async function communityGetSentContactRequests() {
    return apiRequest('GET', '/contact-requests/sent', null, true);
}

async function communityCancelContactRequest(id) {
    return apiRequest('DELETE', '/contact-requests/' + id, null, true);
}

async function communityAcceptContactRequest(id) {
    return apiRequest('POST', '/contact-requests/' + id + '/accept', null, true);
}

async function communityDeclineContactRequest(id) {
    return apiRequest('POST', '/contact-requests/' + id + '/decline', null, true);
}

async function communitySearchMembers(q) {
    return apiRequest('GET', '/members/search?q=' + encodeURIComponent(q), null, true);
}

async function communityGetGroups() {
    return apiRequest('GET', '/groups', null, true);
}

async function communityCreateGroup(name) {
    return apiRequest('POST', '/groups', { name }, true);
}

async function communityDeleteGroup(groupId) {
    return apiRequest('DELETE', '/groups/' + groupId, null, true);
}

async function communityInviteToGroup(groupId, memberId) {
    return apiRequest('POST', '/groups/' + groupId + '/invite', { member_id: memberId }, true);
}

async function communityRemoveFromGroup(groupId, memberId) {
    return apiRequest('DELETE', '/groups/' + groupId + '/members/' + memberId, null, true);
}

async function communityGetInvites() {
    return apiRequest('GET', '/invites', null, true);
}

async function communityAcceptInvite(inviteId) {
    return apiRequest('POST', '/invites/' + inviteId + '/accept', null, true);
}

async function communityDeclineInvite(inviteId) {
    return apiRequest('POST', '/invites/' + inviteId + '/decline', null, true);
}

// --- Logbook ---

async function communityGetLogs() {
    return apiRequest('GET', '/logs', null, true);
}

async function communityCreateLog(payload) {
    return apiRequest('POST', '/logs', payload, true);
}

async function communityDeleteLog(id) {
    return apiRequest('DELETE', '/logs/' + id, null, true);
}

async function communityGetPendingLiveRequests() {
    return apiRequest('GET', '/live-contacts/pending', null, true);
}

async function communityAcceptLiveRequest(id, lat, lng) {
    return apiRequest('POST', '/live-contacts/' + id + '/accept', { lat, lng }, true);
}

async function communityDeclineLiveRequest(id) {
    return apiRequest('POST', '/live-contacts/' + id + '/decline', null, true);
}

async function communityGetActiveLiveContacts() {
    return apiRequest('GET', '/live-contacts', null, true);
}

// --- Announcements ---

async function communityGetAnnouncements() {
    return apiRequest('GET', '/announcements', null, true);
}

async function communityPostAnnouncement(title, body, isPublic) {
    return apiRequest('POST', '/announcements', { title, body, is_public: !!isPublic }, true);
}

async function communityGetAnnouncementsPublic() {
    return apiRequest('GET', '/announcements', null, false);
}

async function communityDeleteAnnouncement(id) {
    return apiRequest('DELETE', '/announcements/' + id, null, true);
}

async function communityGetMember(id) {
    return apiRequest('GET', '/members/' + id, null, true);
}

async function communityAdminResetPassword(memberId) {
    return apiRequest('PUT', '/admin/members/' + memberId + '/reset-password', null, true);
}

// --- Public map contacts ---

async function communityGetPublicMapLogs() {
    return apiRequest('GET', '/logs/public-map', null, true);
}

// --- MeshCore nodes ---

async function communityGetMeshcoreNodes() {
    return apiRequest('GET', '/meshcore/nodes', null, true);
}

// --- Manual repeaters ---

async function communityGetRepeaters() {
    return apiRequest('GET', '/repeaters', null, true);
}

async function communityAddRepeater(payload) {
    return apiRequest('POST', '/repeaters', payload, true);
}

async function communityDeleteRepeater(id) {
    return apiRequest('DELETE', '/repeaters/' + id, null, true);
}

const COMMUNITY_API = RPN_API;
