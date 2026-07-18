const TILE_CACHE = 'rpn-tiles-v1';
const APP_CACHE  = 'rpn-app-v1';

const APP_SHELL = [
    'index.html', 'home.html', 'stockpile.html', 'medications.html',
    'checklists.html', 'checklist-detail.html', 'drills.html', 'drill-run.html', 'drill-edit.html',
    'power.html', 'radio.html', 'mesh.html', 'map.html', 'knowledge.html', 'knowledge-article.html',
    'scenarios.html', 'scenario-run.html', 'household.html', 'logbook.html',
    'assessment.html', 'more.html', 'about.html', 'guide.html', 'legal.html',
    'community-map.html', 'community-auth.html', 'community-profile.html',
    'community-contacts.html', 'community-groups.html', 'community-invites.html',
    'noticeboard.html',
    'css/style.css',
    'js/storage.js', 'js/nav.js', 'js/help.js', 'js/readiness.js',
    'js/recommendations.js', 'js/community.js', 'js/push.js',
    'data/checklists.json', 'data/drills.json', 'data/knowledge.json', 'data/scenarios.json',
    'img/rpn-logo.png',
];

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(APP_CACHE).then(function(cache) {
            return Promise.allSettled(
                APP_SHELL.map(function(url) {
                    return cache.add(url).catch(function() {});
                })
            );
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.filter(function(k) {
                return k !== TILE_CACHE && k !== APP_CACHE;
            }).map(function(k) { return caches.delete(k); }));
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(event) {
    var url = event.request.url;

    // Tile caching — network first, fall back to cache
    if (url.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(TILE_CACHE).then(function(cache) {
                return cache.match(event.request).then(function(cached) {
                    if (cached) return cached;
                    return fetch(event.request).then(function(response) {
                        cache.put(event.request, response.clone());
                        return response;
                    }).catch(function() { return cached; });
                });
            })
        );
        return;
    }

    // App shell — cache first, fall back to network
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            return fetch(event.request).then(function(response) {
                if (response.ok) {
                    caches.open(APP_CACHE).then(function(cache) {
                        cache.put(event.request, response.clone());
                    });
                }
                return response;
            });
        })
    );
});
