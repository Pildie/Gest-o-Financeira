const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'), // Certifique-se de ter um icon.png na raiz
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necessário para File System Access API funcionar suavemente em alguns casos
    },
    autoHideMenuBar: true, // Remove a barra de menu padrão (File, Edit...) para parecer app nativo
    backgroundColor: '#f8fafc'
  });

  // Em produção (build), carrega o arquivo compilado pelo Vite.
  // O Vite gera a pasta 'dist'.
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  
  // Se quiser abrir o DevTools para debug:
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});