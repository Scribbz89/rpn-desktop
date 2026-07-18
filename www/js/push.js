// FCM push notification registration via Capacitor
// Safe to call in browser (no-ops when Capacitor is not present)

// Track already-seen IDs so we don't banner the same item twice
const _seen = {
    contactReqs:   new Set(),
    liveReqs:      new Set(),
    announcements: new Set(),
    onAirPins:     new Set(),
    groupInvites:  new Set(),
    contacts:      new Set(), // accepted contacts — notify when a new one appears
};
let _seededCallsign = null; // track last known callsign to detect new issuance
let _pollInterval = null;

function showInAppNotification(title, body, onClick) {
    const existing = document.getElementById('rpn-notif-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'rpn-notif-banner';
    banner.style.cssText = [
        'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
        'background:#1a2a1a', 'border:1px solid #6dbf5a', 'border-radius:10px',
        'padding:12px 18px', 'z-index:99999', 'max-width:340px', 'width:90%',
        'box-shadow:0 4px 20px rgba(0,0,0,0.5)', 'cursor:pointer',
        'animation:slideDown 0.3s ease'
    ].join(';');
    banner.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div>
                <div style="font-size:14px;font-weight:700;color:#d4d9d4;margin-bottom:3px;">${title || 'RPN Field Brain'}</div>
                ${body ? `<div style="font-size:13px;color:#7a8f78;line-height:1.5;">${body}</div>` : ''}
            </div>
            <button onclick="document.getElementById('rpn-notif-banner').remove()" style="background:none;border:none;color:#7a8f78;font-size:18px;cursor:pointer;padding:0;line-height:1;">✕</button>
        </div>
    `;
    banner.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') {
            banner.remove();
            if (onClick) onClick();
        }
    };
    document.body.appendChild(banner);

    if (!document.getElementById('rpn-notif-style')) {
        const style = document.createElement('style');
        style.id = 'rpn-notif-style';
        style.textContent = '@keyframes slideDown{from{opacity:0;top:0}to{opacity:1;top:16px}}';
        document.head.appendChild(style);
    }

    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 6000);
}

async function _pollNotifications() {
    const token = communityToken();
    if (!token) return;
    const h = { 'Authorization': 'Bearer ' + token };

    // Contact requests
    try {
        const r = await fetch(COMMUNITY_API + '/contact-requests', { headers: h });
        if (r.ok) {
            for (const req of await r.json()) {
                if (!_seen.contactReqs.has(req.id)) {
                    _seen.contactReqs.add(req.id);
                    const name = req.rpn_callsign || req.callsign || req.name || 'Someone';
                    showInAppNotification('Contact Request', `${name} wants to add you as a contact`,
                        () => { window.location.href = 'community-contacts.html'; });
                    return;
                }
            }
        }
    } catch(e) {}

    // Pending live contact requests
    try {
        const r = await fetch(COMMUNITY_API + '/live-contacts/pending', { headers: h });
        if (r.ok) {
            for (const req of await r.json()) {
                if (!_seen.liveReqs.has(req.id)) {
                    _seen.liveReqs.add(req.id);
                    const name = req.requester_callsign || req.requester_name || 'Someone';
                    showInAppNotification('Live Contact Request', `${name} wants to go live on the map with you`,
                        () => { window.location.href = 'logbook.html'; });
                    return;
                }
            }
        }
    } catch(e) {}

    // Live contacts that have been accepted (notify the requester)
    try {
        const r = await fetch(COMMUNITY_API + '/live-contacts', { headers: h });
        if (r.ok) {
            for (const lc of await r.json()) {
                const key = 'accepted_' + lc.id;
                if (lc.status === 'accepted' && !_seen.liveReqs.has(key)) {
                    // Only show to the person who requested it
                    const me = JSON.parse(localStorage.getItem('rpn_community_profile') || '{}');
                    if (me.id && lc.requester_id === me.id) {
                        _seen.liveReqs.add(key);
                        const name = lc.other_callsign || lc.other_name || 'Someone';
                        showInAppNotification('Live Contact Accepted', `${name} accepted — your QSO is live on the map`,
                            () => { window.location.href = 'map.html'; });
                        return;
                    } else {
                        _seen.liveReqs.add(key); // seed so we don't check again
                    }
                }
            }
        }
    } catch(e) {}

    // Contact accepted — check if /contacts has a new entry we haven't seen
    try {
        const r = await fetch(COMMUNITY_API + '/contacts', { headers: h });
        if (r.ok) {
            for (const c of await r.json()) {
                if (!_seen.contacts.has(c.id)) {
                    _seen.contacts.add(c.id);
                    const name = c.rpn_callsign || c.callsign || c.name || 'Someone';
                    showInAppNotification('Contact Request Accepted', `${name} accepted your contact request`,
                        () => { window.location.href = 'logbook.html'; });
                    return;
                }
            }
        }
    } catch(e) {}

    // Announcements
    try {
        const r = await fetch(COMMUNITY_API + '/announcements', { headers: h });
        if (r.ok) {
            for (const ann of await r.json()) {
                if (!_seen.announcements.has(ann.id)) {
                    _seen.announcements.add(ann.id);
                    showInAppNotification(ann.title, ann.body,
                        () => { window.location.href = 'noticeboard.html'; });
                    return;
                }
            }
        }
    } catch(e) {}

    // On Air pins (community)
    try {
        const r = await fetch(COMMUNITY_API + '/pins', { headers: h });
        if (r.ok) {
            for (const pin of await r.json()) {
                if (pin.type === 'on_air' && !_seen.onAirPins.has(pin.id)) {
                    _seen.onAirPins.add(pin.id);
                    const who = pin.author_callsign || pin.author_name || 'A member';
                    const ch = pin.description ? ` — ${pin.description}` : '';
                    showInAppNotification('Member On Air', `${who} is on air${ch}`,
                        () => { window.location.href = 'map.html?focus=on_air&pin=' + pin.id; });
                    return;
                }
            }
        }
    } catch(e) {}

    // Group invites
    try {
        const r = await fetch(COMMUNITY_API + '/invites', { headers: h });
        if (r.ok) {
            for (const inv of await r.json()) {
                if (!_seen.groupInvites.has(inv.id)) {
                    _seen.groupInvites.add(inv.id);
                    showInAppNotification('Group Invite', `${inv.invited_by} invited you to join '${inv.group_name}'`,
                        () => { window.location.href = 'community-groups.html'; });
                    return;
                }
            }
        }
    } catch(e) {}

    // Callsign issued — check if /me now has a callsign we didn't know about
    try {
        const r = await fetch(COMMUNITY_API + '/me', { headers: h });
        if (r.ok) {
            const me = await r.json();
            // Cache profile for use elsewhere (live contact accepted check)
            localStorage.setItem('rpn_community_profile', JSON.stringify(me));
            const cs = me.rpn_callsign;
            if (cs && _seededCallsign === '' && cs !== '') {
                showInAppNotification('RPN Callsign Issued', `Your callsign is ${cs} — welcome to the network!`,
                    () => { window.location.href = 'community-profile.html'; });
            }
            if (_seededCallsign === null) _seededCallsign = cs || '';
        }
    } catch(e) {}
}

async function _seedSeenIds() {
    const token = communityToken();
    if (!token) return;
    const h = { 'Authorization': 'Bearer ' + token };

    // Contact requests are NOT seeded — they're actionable and must always notify until accepted/declined
    try { const r = await fetch(COMMUNITY_API + '/live-contacts/pending', { headers: h }); if (r.ok) { (await r.json()).forEach(x => _seen.liveReqs.add(x.id)); } } catch(e) {}
    try { const r = await fetch(COMMUNITY_API + '/live-contacts', { headers: h }); if (r.ok) { (await r.json()).forEach(x => _seen.liveReqs.add('accepted_' + x.id)); } } catch(e) {}
    try { const r = await fetch(COMMUNITY_API + '/announcements', { headers: h }); if (r.ok) { (await r.json()).forEach(x => _seen.announcements.add(x.id)); } } catch(e) {}
    try { const r = await fetch(COMMUNITY_API + '/pins', { headers: h }); if (r.ok) { (await r.json()).filter(p => p.type === 'on_air').forEach(x => _seen.onAirPins.add(x.id)); } } catch(e) {}
    try { const r = await fetch(COMMUNITY_API + '/invites', { headers: h }); if (r.ok) { (await r.json()).forEach(x => _seen.groupInvites.add(x.id)); } } catch(e) {}
    try { const r = await fetch(COMMUNITY_API + '/contacts', { headers: h }); if (r.ok) { (await r.json()).forEach(x => _seen.contacts.add(x.id)); } } catch(e) {}
    try { const r = await fetch(COMMUNITY_API + '/me', { headers: h }); if (r.ok) { const me = await r.json(); localStorage.setItem('rpn_community_profile', JSON.stringify(me)); _seededCallsign = me.rpn_callsign || ''; } } catch(e) {}
}

function startNotificationPolling() {
    if (_pollInterval) return;
    _seedSeenIds();
    _pollInterval = setInterval(_pollNotifications, 30000);
}

async function registerPushNotifications() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
        if (communityToken()) startNotificationPolling();
        return;
    }
    if (!communityToken()) return;

    startNotificationPolling();

    try {
        const { PushNotifications } = Capacitor.Plugins;

        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') return;

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
            try {
                await fetch(COMMUNITY_API + '/device-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + communityToken() },
                    body: JSON.stringify({ token: token.value }),
                });
            } catch(e) { console.warn('Could not register device token:', e.message); }
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            showInAppNotification(notification.title, notification.body);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const data = action.notification.data;
            if (!data) return;
            const nav = {
                live_contact:        'logbook.html',
                live_contact_accepted:'map.html',
                announcement:        'noticeboard.html',
                callsign_issued:     'community-profile.html',
                on_air:              'map.html?focus=on_air' + (data.pin_id ? '&pin=' + data.pin_id : ''),
                contact_request:     'community-contacts.html',
                contact_accepted:    'community-contacts.html',
                group_invite:        'community-groups.html',
            };
            if (nav[data.type]) window.location.href = nav[data.type];
        });

    } catch(e) { console.warn('Push notification setup failed:', e.message); }
}
