const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
                             hardResetMethod: 'exit'
  });
}

// Fix for graphics rendering issues on Linux
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu-compositing');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');

// Alternative: Use software rendering if hardware acceleration is problematic
// app.disableHardwareAcceleration();

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 500,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
                                       // Additional web preferences to help with rendering
                                       experimentalFeatures: false,
                                       enableRemoteModule: false,
                                       worldSafeExecuteJavaScript: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Will fallback to available formats
                                       titleBarStyle: 'default',
                                       show: false, // Don't show until ready
                                       // Additional window options for better rendering
                                       backgroundColor: '#667eea', // Match your app's background
                                       webSecurity: true
  });

  // Load the HTML file
  mainWindow.loadFile('renderer.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Optional: Force a repaint to ensure proper rendering
    mainWindow.webContents.executeJavaScript(`
    document.body.style.transform = 'translateZ(0)';
    `);
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Generate New Code',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow.webContents.send('generate-code');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Random Code Generator',
              message: 'Random Code Generator v1.0.0',
              detail: 'A desktop application for generating random studio codes with numbers.\n\nBuilt with Electron for Linux.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle graphics context lost (helps with rendering issues)
  mainWindow.webContents.on('gpu-process-crashed', (event, killed) => {
    console.log('GPU process crashed, reloading...');
    mainWindow.reload();
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Set app user model ID for Windows (optional but good practice)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.yourname.random-code-generator');
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    require('electron').shell.openExternal(navigationURL);
  });
});

// Handle certificate errors (optional security enhancement)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(false);
});

// Clean up resources when app is about to quit
app.on('before-quit', () => {
  // Clean up any resources if needed
  if (process.env.NODE_ENV === 'development') {
    // Remove electron-reload listeners
    try {
      require('electron-reload').cleanup();
    } catch (err) {
      // Ignore cleanup errors in development
    }
  }
});
