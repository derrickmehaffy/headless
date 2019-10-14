/**
 * Copyright © 2019, Bucan Befestigungstechnik AG
 *
 * MIT
 *
 * This is the entry file of headless.
 *
 * @summary Headless a place for all your backends.
 * @author Fabio Nettis
 *
 * Created at     : 2019-10-14 07:02:45
 * Last modified  : 2019-10-14 16:48:43
 */

const path = require('path');
const {
  BrowserWindow,
  app: App,
  ipcMain,
  shell,
} = require('electron');
const SettingsHelper = require('./helpers/SettingsHelper');

const envs = path.join(__dirname, './pages/Environments.html');
const about = path.join(__dirname, './pages/About.html');
const addEnv = path.join(__dirname, './pages/AddEnv.html');
const manageEnv = path.join(__dirname, './pages/ManageEnv.html');
const currentEnv = path.join(__dirname, './pages/CurrentEnv.html');
const addFirstEnv = path.join(__dirname, './pages/AddFirstEnv.html');

const Headless = {
  init: async () => {
    // create a new BrowserWindow
    const browserWindow = new BrowserWindow({
      frame: false,
      height: 855,
      width: 1480,
      webPreferences: {
        nodeIntegration: true, // allows require() in html files
      },
    });

    // check if entries are present
    const isEmpty = await SettingsHelper.empty();

    if (!isEmpty) {
      browserWindow.loadFile(currentEnv);
    } else {
      browserWindow.loadFile(addFirstEnv);
    }

    // ipc callbacks
    ipcMain.on('onNavigation', (_, location) => {
      switch (location) {
        case 'manage': {
          browserWindow.loadFile(manageEnv);
          break;
        }

        case 'environments': {
          browserWindow.loadFile(envs);
          break;
        }

        case 'add': {
          browserWindow.loadFile(addEnv);
          break;
        }

        case 'about': {
          browserWindow.loadFile(about);
          break;
        }

        case 'help': {
          shell.openExternal('https://github.com/fabio-nettis/headless');
          break;
        }

        default: browserWindow.loadFile(currentEnv);
      }
    });

    ipcMain.on('onItemRemoved', async (_, { name }) => {
      await SettingsHelper.delete(name);
      const empty = await SettingsHelper.empty();

      if (empty) {
        browserWindow.loadFile(currentEnv);
      } else {
        browserWindow.loadFile(addFirstEnv);
      }
    });

    ipcMain.on('onActiveChanged', async (_, name) => {
      await SettingsHelper.set(name);
      browserWindow.loadFile(currentEnv);
    });

    ipcMain.on('onItemAdded', async (_, item) => {
      await SettingsHelper.add(item);
      browserWindow.loadFile(currentEnv);
    });

    ipcMain.on('onItemUpdated', async (_, { name, item }) => {
      await SettingsHelper.update(name, item);
      browserWindow.loadFile(currentEnv);
    });
  },
};

App.on('ready', Headless.init);
