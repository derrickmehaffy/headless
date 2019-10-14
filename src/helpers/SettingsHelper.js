/**
 * @description
 * Helper for interactions with the
 * environments.json file.
 */

const path = require('path');
const fs = require('fs-extra');

const SettingsHelper = {
  file: path.join(__dirname, '../data/environments.json'),
  /**
   * @param {String} url
   * The url of the environment
   * @param {String} name
   * The name for the environment
   * @param {Boolean} active
   * If the environment is the currently selected
   * @returns {Promise<{ url: String, name: String, active: Boolean }>}
   * Returns the created entry
   */
  add: async ({ url = null, name = null, active = false }) => {
    // validate paramters
    if (!url) {
      throw new Error('Paramter "url" cannot be empty.');
    }

    if (!SettingsHelper.isUrl(url)) {
      throw new Error('The given url is invalid.');
    }

    if (!name) {
      throw new Error('Paramter "name" cannot be empty.');
    }

    let entries = await SettingsHelper.read();

    // check for duplicates
    const hasDuplicates = entries.filter((value) => value.url === url || value.name === name).length > 0;

    if (hasDuplicates) {
      throw new Error('Function add expects entries to be unique.');
    }

    // update active state
    if (active && entries.length > 0) {
      entries = await SettingsHelper.unset();
    }

    // add the entry to the dataset
    const newEntry = { name, url, active };
    entries.push(newEntry);
    await fs.writeJSON(SettingsHelper.file, { environments: entries }, { spaces: '\t' });

    return newEntry;
  },

  /**
   * @returns {Promise<[{ url: String, name: String, active: Boolean }]>}
   * Returns the contents of the environments file.
   */
  read: async () => {
    const data = await fs.readJSON(SettingsHelper.file);
    return data.environments;
  },

  /**
   * @param {String} searchName
   * The name of the environment
   * @param {{ url: String, name: String, active: Boolean }} update
   * The update for the environment.
   * @param {String} update.url
   * The url of the environment
   * @param {String} update.name
   * The name for the environment
   * @param {Boolean} update.active
   * If the environment is the currently selected
   * @returns {Promise<{ url: String, name: String, active: Boolean }>}
   * Returns the updated entry
   */
  update: async (searchName, update) => {
    const { name = null, url = null, active = null } = update;

    // validate paramters
    if (!url && !name && active === null) {
      throw new Error('Please provide one of the paramters "url", "name" or "active".');
    }

    if (url && !SettingsHelper.isUrl(url)) {
      throw new Error('The given url is invalid.');
    }

    // get current dataset and remove searchName
    const entries = await SettingsHelper.read();

    // check for duplicates
    const hasDuplicates = entries.filter((value) => value.url === url || value.name === name).length > 0;

    if (hasDuplicates) {
      throw new Error('Function update expects entries to be unique.');
    }

    entries.push({ name, url, active });
    await fs.writeJSON(SettingsHelper.file, { environments: entries }, { spaces: '\t' });

    return entries;
  },

  /**
   * @param {String} name
   * The name of the environment
   * @returns {Promise<{ url: String, name: String, active: Boolean }>}
   * Returns the deleted entry
   */
  delete: async (name) => {
    if (!name) {
      throw new Error('Paramter "name" cannot be empty.');
    }

    const entries = await SettingsHelper.read();
    const entry = entries.find((value) => value.name === name);
    const updated = entries.filter((value) => value.name !== name);

    await fs.writeJSON(SettingsHelper.file, { environments: updated }, { spaces: '\t' });
    return entry;
  },

  /**
   * @returns {Promise<{ url: String, name: String, active: Boolean }>}
   * Returns the currently active element
   */
  active: async () => {
    const entries = await SettingsHelper.read();
    const active = entries.find((value) => value.active);
    return active;
  },

  /**
   * @param {String} url
   * The url to be validated
   * @returns {Boolean}
   * Returns true if valid false if not.
   */
  isUrl: (url) => {
    const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
      + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' // domain name
      + '((\\d{1,3}\\.){3}\\d{1,3}))' // IP (V4) address
      + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port
      + '(\\?[;&amp;a-z\\d%_.~+=-]*)?' // query string
      + '(\\#[-a-z\\d_]*)?$', 'i');

    if (pattern.test(url)) {
      return true;
    }

    return false;
  },

  /**
   * @returns {Promise<[{ url: String, name: String, active: Boolean }]>}
   * Returns the updated dataset
   */
  unset: async () => {
    // get current data
    const entries = await SettingsHelper.read();
    const active = await SettingsHelper.active();

    // create updated array
    active.active = false;
    const data = [...entries.filter((value) => !value.active), active];

    await fs.writeJSON(SettingsHelper.file, { environments: data }, { spaces: '\t' });
    return data;
  },

  /**
   * @returns {Boolean}
   * Returns if the dataset has entries
   */
  empty: async () => {
    const entries = await SettingsHelper.read();
    return entries.length === 0;
  },

  set: async (name) => {
    const unsetEntries = await SettingsHelper.unset();
    const foundItem = unsetEntries.find((value) => value.name === name);
    foundItem.active = true;

    const setEntries = unsetEntries.filter((value) => value.name !== name);
    setEntries.push(foundItem);

    await fs.writeJSON(SettingsHelper.file, { environments: setEntries }, { spaces: '\t' });
    return foundItem;
  },
};

module.exports = SettingsHelper;
