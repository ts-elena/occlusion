const electron = require('electron');

const { app, BrowserWindow, ipcMain } = electron;

let mainWindow = null;
let childWindow = null;
let toastLiftUp = 0;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        height: 500,
        width: 500
    });

    childWindow = new BrowserWindow({
        height: 500,
        width: 500
    });

    mainWindow.loadURL(`file://${__dirname}/mainRenderer.html`);
    childWindow.loadURL(`file://${__dirname}/childRenderer.html`);

    mainWindow.on('closed', _ => {
        mainWindow = null;
    })
})

ipcMain.on('input-event', (event) => {
    console.log('ipc-received');
    const windowWithElement = [mainWindow, childWindow].find(w => w.id == event.sender.id);
    const { screen } = electron;

    let screenUsed;
    if(windowWithElement) {
        const winBounds = windowWithElement.getBounds();
        screenUsed = screen.getDisplayNearestPoint({x: winBounds.x, y: winBounds.y});
    }

    let isOnPrimaryDisplay;
    if(screenUsed) {
        const primaryDisplay = screen.getPrimaryDisplay();

        isOnPrimaryDisplay = screenUsed.id === primaryDisplay.id;
    }

    let isWindowFocused;
    if(isOnPrimaryDisplay) {
        isWindowFocused = windowWithElement.isFocused();
    }

    if(isWindowFocused) {
        const {
            excludeInputMargineBottomRight,
            excludeInputMargineTopRight,
            toastWinY,
            toastWinX,
            inputBottomMargineDp,
            inputHeightDp,
            appBottomRight
        } = getPositionParameters(windowWithElement, screenUsed, 10, 300, 55);

        const isOccluding = isToastOccluding(excludeInputMargineBottomRight, toastWinY, excludeInputMargineTopRight, toastWinX);

        if(isOccluding) {
            toastLiftUp = calculateLiftUp(appBottomRight, inputBottomMargineDp, inputHeightDp);
            console.log('toast is occluding, lifting up')
        } else {
            console.log('toast is not occluding');
        }
    }
})

function getPositionParameters(windowWithElement, screenUsed, inputRightMarginePx, inputBottomMarginePx, inputHeightPx) {
    const mainWindowBounds = windowWithElement.getBounds();
    const displayBounds = screenUsed.bounds;

    const { height: displayHeight, width: displayWidth } = displayBounds;

    const { y: mainWinY, x: mainWinX, height: mainWinHeight, width: mainWinWidth } = mainWindowBounds;
    const { toastWinY, toastWinX } = getToastXY(displayWidth, displayHeight);


    const inputRightMargineDp = pixelsToDp(inputRightMarginePx, displayWidth);
    const inputBottomMargineDp = pixelsToDp(inputBottomMarginePx, displayHeight);
    const inputHeightDp = pixelsToDp(inputHeightPx, displayHeight);

    const appBottomRight = mainWinY + mainWinHeight;
    const appTopRight = mainWinX + mainWinWidth;

    const excludeInputMargineBottomRight = appBottomRight - inputBottomMargineDp;
    const excludeInputMargineTopRight = appTopRight - inputRightMargineDp;

    return {
        excludeInputMargineBottomRight,
        excludeInputMargineTopRight,
        toastWinY,
        toastWinX,
        inputBottomMargineDp,
        inputHeightDp,
        appBottomRight
    }
};

function getToastXY(screenWidth, screenHeight) {
    const mockOfToastWidthDp = 250;
    const mockOfToastHeightDp = 150;

    return {
        toastWinX: screenWidth - mockOfToastWidthDp,
        toastWinY: screenHeight - mockOfToastHeightDp
    }
}

function isToastOccluding(excludeInputMargineBottomRight, toastWinY, excludeInputMargineTopRight, toastWinX) {
    return excludeInputMargineBottomRight > toastWinY && excludeInputMargineTopRight > toastWinX;
}

function calculateLiftUp(appBottomRight, inputBottomMargineDp, inputHeightDp) {
    return appBottomRight + inputBottomMargineDp + inputHeightDp;
}

function pixelsToDp(pixelValue, dpi) {
    return (pixelValue * 160) / dpi;
}