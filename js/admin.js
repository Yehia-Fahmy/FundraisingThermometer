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
  var exportBtn = document.getElementById('exportBtn');
  var clearAllBtn = document.getElementById('clearAllBtn');
  var settingTitleEl = document.getElementById('settingTitle');
  var settingGoalEl = document.getElementById('settingGoal');
  var saveSettingsBtn = document.getElementById('saveSettingsBtn');
  var categoryButtonsEl = document.getElementById('categoryButtons');
  var analyticsSection = document.getElementById('analyticsSection');
  var breakdownGrid = document.getElementById('breakdownGrid');
  var topDonationsList = document.getElementById('topDonationsList');
  var selectedCategory = 'cash';

  categoryButtonsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-category');
    if (!btn) return;
    categoryButtonsEl.querySelectorAll('.btn-category').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    selectedCategory = btn.getAttribute('data-category');
  });

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
      var cat = d.category || 'cash';
      li.innerHTML =
        '<span class="history-item-amount">' + formatMoney(d.amount) + '</span>' +
        '<span class="history-item-category badge-' + cat + '">' + cat + '</span>' +
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

  var CATEGORIES = [
    { key: 'cash',    label: 'Cash' },
    { key: 'cheque',  label: 'Cheque' },
    { key: 'card',    label: 'Card' },
    { key: 'text',    label: 'Text' },
    { key: 'pledges', label: 'Pledges' },
    { key: 'website', label: 'Website' }
  ];

  function renderAnalytics() {
    var donations = FR.getDonations();
    var hasDonations = donations.length > 0;
    analyticsSection.style.display = hasDonations ? '' : 'none';
    if (!hasDonations) return;

    var totals = {};
    var counts = {};
    CATEGORIES.forEach(function (c) { totals[c.key] = 0; counts[c.key] = 0; });
    var grandTotal = 0;
    donations.forEach(function (d) {
      var cat = d.category || 'cash';
      totals[cat] = (totals[cat] || 0) + d.amount;
      counts[cat] = (counts[cat] || 0) + 1;
      grandTotal += d.amount;
    });

    breakdownGrid.innerHTML = '';
    CATEGORIES.forEach(function (c) {
      var amount = totals[c.key];
      var count = counts[c.key];
      var pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
      var item = document.createElement('div');
      item.className = 'breakdown-item';
      item.innerHTML =
        '<div class="breakdown-bar-track"><div class="breakdown-bar-fill badge-' + c.key + '" style="width:' + pct + '%"></div></div>' +
        '<div class="breakdown-details">' +
          '<span class="breakdown-label badge-' + c.key + '">' + c.label + '</span>' +
          '<span class="breakdown-amount">' + formatMoney(amount) + '</span>' +
          '<span class="breakdown-meta">' + count + ' donation' + (count !== 1 ? 's' : '') + ' &middot; ' + pct + '%</span>' +
        '</div>';
      breakdownGrid.appendChild(item);
    });

    var top = donations.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 5);
    topDonationsList.innerHTML = '';
    top.forEach(function (d, i) {
      var dt = d.timestamp ? new Date(d.timestamp) : new Date();
      var timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var cat = d.category || 'cash';
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="top-rank">' + (i + 1) + '</span>' +
        '<span class="top-amount">' + formatMoney(d.amount) + '</span>' +
        '<span class="history-item-category badge-' + cat + '">' + cat + '</span>' +
        '<span class="top-time">' + timeStr + '</span>';
      topDonationsList.appendChild(li);
    });
  }

  function render() {
    renderTotal();
    renderAnalytics();
    renderHistory();
  }

  function submitDonation() {
    var raw = donationAmountEl.value.trim();
    if (!raw) return;
    var entry = FR.addDonation(raw, selectedCategory);
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
