const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 440,
        height: 900,
        minWidth: 360,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'www', 'img', 'rpn-logo.png'),
        title: 'RPN Field Brain',
        backgroundColor: '#080e08',
        autoHideMenuBar: true,
    });

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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});
