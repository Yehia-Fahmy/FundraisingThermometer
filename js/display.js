/**
 * Display view: rendering, counting animation, confetti, milestone detection, storage listener.
 */
(function () {
  'use strict';

  var FR = window.FRStorage;
  if (!FR) return;

  var DURATION_COUNT = 1500;
  var MILESTONES = [0.25, 0.5, 0.75, 1];
  var CONFETTI_COUNT = 200;

  var counterEl = document.getElementById('counterValue');
  var goalTextEl = document.getElementById('goalText');
  var goalPercentEl = document.getElementById('goalPercent');
  var thermometerFill = document.getElementById('thermometerFill');
  var eventTitleEl = document.getElementById('eventTitle');
  var recentListEl = document.getElementById('recentList');
  var flashOverlay = document.getElementById('flashOverlay');
  var confettiCanvas = document.getElementById('confettiCanvas');

  var currentTotal = 0;
  var displayedTotal = 0;
  var rafId = null;
  var milestonesHit = {};

  function formatMoney(n) {
    return '$' + Math.round(n).toLocaleString();
  }

  function renderSettings(settings) {
    eventTitleEl.textContent = settings.title || 'Fundraising Night';
    goalTextEl.textContent = 'Goal: ' + formatMoney(settings.goal || 50000);
  }

  function renderProgress(total, goal) {
    var pct = goal > 0 ? Math.min(100, (total / goal) * 100) : 0;
    goalPercentEl.textContent = pct.toFixed(1) + '%';
    thermometerFill.style.width = pct + '%';
    if (pct > 0) thermometerFill.classList.add('glow');
    else thermometerFill.classList.remove('glow');
  }

  function animateCounter(from, to, onComplete) {
    var start = performance.now();
    function tick(now) {
      var t = (now - start) / DURATION_COUNT;
      if (t >= 1) {
        displayedTotal = to;
        counterEl.textContent = formatMoney(to);
        if (onComplete) onComplete();
        return;
      }
      var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      displayedTotal = Math.round(from + (to - from) * eased);
      counterEl.textContent = formatMoney(displayedTotal);
      rafId = requestAnimationFrame(tick);
    }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function triggerFlash() {
    flashOverlay.classList.remove('flash-active');
    flashOverlay.offsetHeight;
    flashOverlay.classList.add('flash-active');
    setTimeout(function () {
      flashOverlay.classList.remove('flash-active');
    }, 600);
  }

  function triggerCounterBump() {
    counterEl.classList.remove('bump');
    counterEl.offsetHeight;
    counterEl.classList.add('bump');
    setTimeout(function () {
      counterEl.classList.remove('bump');
    }, 400);
  }

  function runConfetti() {
    var ctx = confettiCanvas.getContext('2d');
    var w = confettiCanvas.width = confettiCanvas.offsetWidth;
    var h = confettiCanvas.height = confettiCanvas.offsetHeight;
    var particles = [];
    var colors = ['#fbbf24', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#ef4444', '#06b6d4'];

    for (var i = 0; i < CONFETTI_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 8,
        vy: -4 - Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
        life: 1
      });
    }

    function loop() {
      ctx.clearRect(0, 0, w, h);
      var anyAlive = false;
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.vy += 0.2;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.life -= 0.012;
        if (p.life <= 0) continue;
        anyAlive = true;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (anyAlive) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function markMilestonesReached(total, goal) {
    if (!goal || goal <= 0) return;
    var pct = total / goal;
    for (var i = 0; i < MILESTONES.length; i++) {
      if (pct >= MILESTONES[i]) milestonesHit[MILESTONES[i]] = true;
    }
  }

  function checkMilestones(total, goal) {
    if (!goal || goal <= 0) return;
    var pct = total / goal;
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (pct >= m && !milestonesHit[m]) {
        milestonesHit[m] = true;
        runConfetti();
        break;
      }
    }
  }

  function renderRecent(donations) {
    var recent = donations.slice(-5).reverse();
    recentListEl.innerHTML = '';
    recent.forEach(function (d, i) {
      var li = document.createElement('li');
      li.textContent = formatMoney(d.amount);
      li.style.animationDelay = (i * 0.05) + 's';
      recentListEl.appendChild(li);
    });
  }

  function fullRender(isInitialLoad) {
    var settings = FR.getSettings();
    var donations = FR.getDonations();
    var total = FR.getTotal();
    var goal = settings.goal || 50000;

    if (isInitialLoad) markMilestonesReached(total, goal);

    renderSettings(settings);
    renderRecent(donations);
    renderProgress(total, goal);

    if (total !== displayedTotal) {
      animateCounter(displayedTotal, total, function () {
        triggerCounterBump();
        checkMilestones(total, goal);
      });
    }
    currentTotal = total;
  }

  function onDataChange() {
    var prevTotal = currentTotal;
    fullRender();
    if (currentTotal > prevTotal && prevTotal >= 0) {
      triggerFlash();
    }
  }

  FR.onStorageChange(onDataChange);

  document.addEventListener('DOMContentLoaded', function () {
    fullRender(true);
  });
})();
