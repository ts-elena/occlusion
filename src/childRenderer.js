const electron = require('electron');

const ipc = electron.ipcRenderer;

document.addEventListener("DOMContentLoaded", function(event) { 
    document.getElementById('child-input').addEventListener('input', _ => {
        console.log('ipc-sent');
        ipc.send('input-event');
    })
  });