/**
 * Shared storage layer for Fundraising Display App.
 * Data model, localStorage read/write, UUID, and cross-tab event helpers.
 */
(function (global) {
  'use strict';

  var KEYS = {
    SETTINGS: 'fr_settings',
    DONATIONS: 'fr_donations',
    LAST_UPDATE: 'fr_lastUpdate'
  };

  var DEFAULT_SETTINGS = {
    title: 'Fundraising Night',
    goal: 50000
  };

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSettings() {
    try {
      var raw = localStorage.getItem(KEYS.SETTINGS);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_SETTINGS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function setSettings(settings) {
    var merged = Object.assign({}, DEFAULT_SETTINGS, getSettings(), settings);
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
    bumpLastUpdate();
  }

  function getDonations() {
    try {
      var raw = localStorage.getItem(KEYS.DONATIONS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function setDonations(donations) {
    localStorage.setItem(KEYS.DONATIONS, JSON.stringify(donations));
    bumpLastUpdate();
  }

  function bumpLastUpdate() {
    localStorage.setItem(KEYS.LAST_UPDATE, String(Date.now()));
  }

  function getTotal() {
    return getDonations().reduce(function (sum, d) { return sum + (d.amount || 0); }, 0);
  }

  function addDonation(amount) {
    var num = Math.round(Number(amount));
    if (!num || num <= 0) return null;
    var donations = getDonations();
    var entry = {
      id: uuid(),
      amount: num,
      timestamp: new Date().toISOString()
    };
    donations.push(entry);
    setDonations(donations);
    return entry;
  }

  function removeDonation(id) {
    var donations = getDonations().filter(function (d) { return d.id !== id; });
    setDonations(donations);
  }

  function clearAllDonations() {
    setDonations([]);
  }

  function onStorageChange(callback) {
    function handler(e) {
      if (e.key === KEYS.DONATIONS || e.key === KEYS.SETTINGS || e.key === KEYS.LAST_UPDATE) {
        callback(e);
      }
    }
    if (global.addEventListener) {
      global.addEventListener('storage', handler);
      return function () { global.removeEventListener('storage', handler); };
    }
    return function () {};
  }

  function exportDonationsCSV() {
    var donations = getDonations();
    var headers = 'Amount,Date,Time\n';
    var rows = donations.map(function (d) {
      var dt = d.timestamp ? new Date(d.timestamp) : new Date();
      return d.amount + ',' + dt.toLocaleDateString() + ',' + dt.toLocaleTimeString();
    });
    return headers + rows.join('\n');
  }

  global.FRStorage = {
    KEYS: KEYS,
    getSettings: getSettings,
    setSettings: setSettings,
    getDonations: getDonations,
    setDonations: setDonations,
    getTotal: getTotal,
    addDonation: addDonation,
    removeDonation: removeDonation,
    clearAllDonations: clearAllDonations,
    onStorageChange: onStorageChange,
    bumpLastUpdate: bumpLastUpdate,
    exportDonationsCSV: exportDonationsCSV
  };
})(typeof window !== 'undefined' ? window : this);
