const { app, BrowserWindow, Menu, MenuItem, dialog, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// Some Windows GPUs/drivers leave the window black. When that happens we
// remember it with a flag file and run with hardware acceleration off.
const SAFE_GRAPHICS_FLAG = path.join(app.getPath('userData'), 'disable-gpu');
const safeGraphics = fs.existsSync(SAFE_GRAPHICS_FLAG) || process.argv.includes('--disable-gpu');

if (safeGraphics) {
    app.disableHardwareAcceleration();
}

function setSafeGraphics(enabled) {
    try {
        if (enabled) fs.writeFileSync(SAFE_GRAPHICS_FLAG, '1');
        else fs.rmSync(SAFE_GRAPHICS_FLAG, { force: true });
    } catch (e) {
        console.error('Could not update graphics setting:', e);
    }
}

function restartApp() {
    app.relaunch();
    app.exit(0);
}

function restartInSafeGraphics() {
    setSafeGraphics(true);
    restartApp();
}

function buildMenu() {
    const menu = Menu.getApplicationMenu() || new Menu();
    menu.append(new MenuItem({
        label: 'Troubleshoot',
        submenu: [
            { label: 'Reload', accelerator: 'F5', click: (item, win) => win && win.webContents.reload() },
            { type: 'separator' },
            safeGraphics
                ? { label: 'Turn Graphics Acceleration Back On', click: () => { setSafeGraphics(false); restartApp(); } }
                : { label: 'Restart in Safe Graphics Mode', click: restartInSafeGraphics },
        ],
    }));
    Menu.setApplicationMenu(menu);
}

let errorDialogOpen = false;

function showErrorDialog(win, message) {
    if (win.isDestroyed() || errorDialogOpen) return;
    errorDialogOpen = true;
    if (!win.isVisible()) win.show();
    const buttons = ['Reload', 'Quit'];
    if (!safeGraphics) buttons.splice(1, 0, 'Restart in Safe Graphics Mode');
    dialog.showMessageBox(win, {
        type: 'error',
        title: 'RPN Field Brain',
        message: 'Something went wrong',
        detail: message,
        buttons,
        defaultId: 0,
        cancelId: buttons.length - 1,
    }).then(({ response }) => {
        errorDialogOpen = false;
        const choice = buttons[response];
        if (choice === 'Reload') win.loadFile(path.join(__dirname, 'www', 'home.html'));
        else if (choice === 'Restart in Safe Graphics Mode') restartInSafeGraphics();
        else app.quit();
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 440,
        height: 900,
        minWidth: 360,
        minHeight: 600,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'www', 'img', 'rpn-logo.png'),
        title: 'RPN Field Brain',
        backgroundColor: '#080e08',
        autoHideMenuBar: true,
    });

    // Only show the window once the page has actually painted. If it never
    // does, the renderer is stuck (usually the GPU) so offer safe graphics.
    let shown = false;
    win.once('ready-to-show', () => {
        shown = true;
        win.show();
    });
    setTimeout(() => {
        if (shown || win.isDestroyed()) return;
        showErrorDialog(win, 'The app is taking too long to display. This is usually a graphics driver problem — restarting in Safe Graphics Mode normally fixes it.');
    }, 15000);

    win.loadFile(path.join(__dirname, 'www', 'home.html'));

    win.webContents.on('did-finish-load', () => {
        // Inject error handler to catch JS crashes and reload
        win.webContents.executeJavaScript(`
            window.addEventListener('error', function(e) {
                console.error('Page error:', e.message);
            });
            window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
            });
        `);
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        // -3 (ERR_ABORTED) just means a navigation was interrupted by another one
        if (!isMainFrame || errorCode === -3) return;
        showErrorDialog(win, 'The page failed to load (' + errorDescription + ').');
    });

    win.webContents.on('render-process-gone', (event, details) => {
        if (details.reason === 'clean-exit') return;
        showErrorDialog(win, 'The app window stopped working (' + details.reason + ').');
    });

    win.on('unresponsive', () => {
        showErrorDialog(win, 'The app is not responding.');
    });

    // Open external links in the system browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    win.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
}

// If the GPU process crashes, switch to safe graphics automatically (once)
app.on('child-process-gone', (event, details) => {
    if (details.type === 'GPU' && details.reason !== 'clean-exit' && !safeGraphics) {
        restartInSafeGraphics();
    }
});

app.whenReady().then(async () => {
    // The www service worker is for the mobile/web build. Under file:// it
    // can't fetch pages, so once registered every page load fails (black
    // screen). Remove any old registration — saved app data is untouched.
    await session.defaultSession.clearStorageData({ storages: ['serviceworkers'] }).catch(() => {});
    buildMenu();
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});
