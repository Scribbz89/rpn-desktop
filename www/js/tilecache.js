// Tile cache using IndexedDB — works in Capacitor Android WebView
// Replaces the service worker approach which doesn't work in WebView

const TILE_DB_NAME    = 'rpn-tile-cache';
const TILE_DB_VERSION = 1;
const TILE_STORE      = 'tiles';

let _db = null;

function openTileDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(TILE_DB_NAME, TILE_DB_VERSION);
        req.onupgradeneeded = e => {
            e.target.result.createObjectStore(TILE_STORE);
        };
        req.onsuccess = e => { _db = e.target.result; resolve(_db); };
        req.onerror   = e => reject(e.target.error);
    });
}

async function getTile(url) {
    const db = await openTileDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(TILE_STORE, 'readonly');
        const req = tx.objectStore(TILE_STORE).get(url);
        req.onsuccess = e => resolve(e.target.result || null);
        req.onerror   = e => reject(e.target.error);
    });
}

async function putTile(url, dataUrl) {
    const db = await openTileDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(TILE_STORE, 'readwrite');
        const req = tx.objectStore(TILE_STORE).put(dataUrl, url);
        req.onsuccess = () => resolve();
        req.onerror   = e => reject(e.target.error);
    });
}

async function countTiles() {
    const db = await openTileDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(TILE_STORE, 'readonly');
        const req = tx.objectStore(TILE_STORE).count();
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function clearTiles() {
    const db = await openTileDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(TILE_STORE, 'readwrite');
        const req = tx.objectStore(TILE_STORE).clear();
        req.onsuccess = () => resolve();
        req.onerror   = e => reject(e.target.error);
    });
}

// Fetch a tile and store as base64 in IndexedDB
async function cacheTile(url) {
    try {
        const existing = await getTile(url);
        if (existing) return; // already cached
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return;
        const blob   = await res.blob();
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
            reader.onloadend = resolve;
            reader.onerror   = reject;
            reader.readAsDataURL(blob);
        });
        await putTile(url, reader.result);
    } catch(e) {
        // Silently skip failed tiles
    }
}

// Build a cached tile layer for Leaflet
function CachedTileLayer(urlTemplate, options) {
    const layer = L.tileLayer(urlTemplate, options);
    const origCreateTile = layer.createTile.bind(layer);

    layer.createTile = function(coords, done) {
        const img = document.createElement('img');
        img.setAttribute('role', 'presentation');
        img.crossOrigin = '';

        const url = layer.getTileUrl(coords);

        getTile(url).then(cached => {
            if (cached) {
                img.src = cached;
                done(null, img);
            } else {
                img.onload  = () => done(null, img);
                img.onerror = (e) => done(e, img);
                img.src = url;
            }
        }).catch(() => {
            img.onload  = () => done(null, img);
            img.onerror = (e) => done(e, img);
            img.src = url;
        });

        return img;
    };

    return layer;
}
