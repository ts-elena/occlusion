const electron = require('electron');

const ipc = electron.ipcRenderer;

document.getElementById('main-input').onchange(_ => {
    ipc.send('input-event');
})