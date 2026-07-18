// RPN Field Brain — Shared navigation

const NAV_ITEMS = [
    { id: 'power', label: 'Power', icon: '⚡', href: 'power.html' },
    { id: 'checklists', label: 'Lists', icon: '&#10003;', href: 'checklists.html' },
    { id: 'stockpile', label: 'Stockpile', icon: '#', href: 'stockpile.html' },
    { id: 'map', label: 'Map', icon: '&#9655;', href: 'map.html' },
    { id: 'logbook', label: 'Logbook', icon: '&#128214;', href: 'logbook.html' },
    { id: 'more', label: 'More', icon: '&#8942;', href: 'more.html' },
];

const MORE_IDS = ['more', 'radio', 'mesh', 'household'];

function renderNav(activePage) {
    const items = NAV_ITEMS.map(p => {
        const isActive = p.id === activePage || (p.id === 'more' && MORE_IDS.includes(activePage));
        return `<a href="${p.href}" class="bnav-item${isActive ? ' active' : ''}">
            <span class="bnav-icon">${p.icon}</span>
            <span class="bnav-label">${p.label}</span>
        </a>`;
    }).join('');

    const root = document.getElementById('nav-root');
    if (root) {
        root.innerHTML = `
        <header class="app-header" style="gap:12px;">
            ${activePage !== 'home' ? `<a href="home.html" style="background:none;border:1px solid #3a5a3a;color:#7a8f78;border-radius:6px;padding:4px 10px;font-size:12px;text-decoration:none;flex-shrink:0;white-space:nowrap;">⌂ Home</a>` : `<span></span>`}
            <a href="home.html" class="app-title">RPN Field Brain</a>
            <button onclick="showPageHelp('${activePage}')" style="background:#1a3a1a;border:1px solid #6dbf5a;color:#6dbf5a;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;flex-shrink:0;white-space:nowrap;" title="Help">ℹ Help</button>
        </header>
        <nav class="bottom-nav">${items}</nav>
        <footer class="app-footer">
            <span>RPN Field Brain</span>
            <a href="legal.html">Legal &amp; Disclaimer</a>
        </footer>`;
    }

}

