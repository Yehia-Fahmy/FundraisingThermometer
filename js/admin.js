/**
 * Admin panel: donation input, preset buttons, history list, undo/delete, settings, CSV export.
 */
(function () {
  'use strict';

  var FR = window.FRStorage;
  if (!FR) return;

  var donationAmountEl = document.getElementById('donationAmount');
  var addDonationBtn = document.getElementById('addDonationBtn');
  var runningTotalEl = document.getElementById('runningTotal');
  var historyListEl = document.getElementById('historyList');
  var openDisplayBtn = document.getElementById('openDisplayBtn');
  var exportBtn = document.getElementById('exportBtn');
  var clearAllBtn = document.getElementById('clearAllBtn');
  var settingTitleEl = document.getElementById('settingTitle');
  var settingGoalEl = document.getElementById('settingGoal');
  var saveSettingsBtn = document.getElementById('saveSettingsBtn');

  function formatMoney(n) {
    return '$' + Math.round(n).toLocaleString();
  }

  function renderTotal() {
    runningTotalEl.textContent = formatMoney(FR.getTotal());
  }

  function renderHistory() {
    var donations = FR.getDonations();
    historyListEl.innerHTML = '';
    clearAllBtn.style.display = donations.length === 0 ? 'none' : '';
    if (donations.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'empty-history';
      empty.textContent = 'No donations yet. Add one above.';
      historyListEl.appendChild(empty);
      return;
    }
    donations.slice().reverse().forEach(function (d) {
      var li = document.createElement('li');
      var dt = d.timestamp ? new Date(d.timestamp) : new Date();
      var timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var dateStr = dt.toLocaleDateString();
      li.innerHTML =
        '<span class="history-item-amount">' + formatMoney(d.amount) + '</span>' +
        '<span class="history-item-meta">' + dateStr + ' ' + timeStr + '</span>' +
        '<span class="history-item-actions"><button type="button" class="btn btn-danger" data-id="' + d.id + '" aria-label="Remove donation">Remove</button></span>';
      var btn = li.querySelector('.btn-danger');
      btn.addEventListener('click', function () {
        FR.removeDonation(d.id);
        render();
      });
      historyListEl.appendChild(li);
    });
  }

  function renderSettings() {
    var s = FR.getSettings();
    settingTitleEl.value = s.title || '';
    settingGoalEl.value = s.goal || '';
  }

  function render() {
    renderTotal();
    renderHistory();
  }

  function submitDonation() {
    var raw = donationAmountEl.value.trim();
    if (!raw) return;
    var entry = FR.addDonation(raw);
    if (entry) {
      donationAmountEl.value = '';
      donationAmountEl.focus();
      render();
    }
  }

  addDonationBtn.addEventListener('click', submitDonation);
  donationAmountEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitDonation();
    }
  });

  document.querySelectorAll('.btn-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var amount = btn.getAttribute('data-amount');
      if (amount) {
        donationAmountEl.value = amount;
        donationAmountEl.focus();
      }
    });
  });

  saveSettingsBtn.addEventListener('click', function () {
    var title = settingTitleEl.value.trim() || 'Fundraising Night';
    var goal = parseInt(settingGoalEl.value, 10);
    if (isNaN(goal) || goal < 1) goal = 50000;
    FR.setSettings({ title: title, goal: goal });
    renderSettings();
  });

  openDisplayBtn.addEventListener('click', function () {
    var base = window.location.href.replace(/\/admin\.html.*$/, '');
    window.open(base + (base.endsWith('/') ? '' : '/') + 'index.html', '_blank', 'noopener');
  });

  clearAllBtn.addEventListener('click', function () {
    if (confirm('Remove all donations? This cannot be undone.')) {
      FR.clearAllDonations();
      render();
    }
  });

  exportBtn.addEventListener('click', function () {
    var csv = FR.exportDonationsCSV();
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fundraising-donations-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  FR.onStorageChange(render);

  document.addEventListener('DOMContentLoaded', function () {
    renderSettings();
    render();
    donationAmountEl.focus();
  });
})();
