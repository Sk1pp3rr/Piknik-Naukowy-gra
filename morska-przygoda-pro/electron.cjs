const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true, // Tryb automatu Arcade (pełny ekran)
    autoHideMenuBar: true, // Ukrywa górne menu (Plik, Edycja itp.)
    closable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Electron ładuje plik z naszego zbudowanego folderu "dist"
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  win.webContents.on('before-input-event', (event, input) => {
    // Sprawdzamy czy wciśnięto Alt oraz czy kod klawisza to F4
    if (input.alt && input.code === 'F4') {
      console.log('Zablokowano próbę zamknięcia przez Alt+F4');
      event.preventDefault(); // Przerywa domyślną akcję systemu
    }
    if (input.code === 'F11'){
        console.log('Zablokowano przycisk F11 w celu zminimalizowania ekranu');
        event.preventDefault();
    }

    if (input.control && input.shift && input.code === 'KeyL') {
      console.log('Administrator wyłączył maszynę (Ctrl+Shift+L).');
      win.webContents.send('open-admin-menu');
    }
  });
  ipcMain.on('toggle-fullscreen', () => {
    const isFullScreen = win.isFullScreen();
    win.setFullScreen(!isFullScreen); // Zmienia stan na przeciwny
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});