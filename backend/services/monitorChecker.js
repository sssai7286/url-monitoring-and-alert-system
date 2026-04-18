const axios = require('axios');
const Monitor = require('../models/Monitor');
const CheckHistory = require('../models/CheckHistory');
const { sendAlert } = require('./alertService');

/**
 * Performs a single HTTP check on a monitor URL.
 * Implements a retry mechanism: tries up to 2 times before marking DOWN.
 * Records result in CheckHistory and updates Monitor stats.
 */
async function checkMonitor(monitor) {
  const MAX_RETRIES = 2;
  let lastError = null;
  let responseTime = null;
  let statusCode = null;
  let isUp = false;

  // --- Retry loop ---
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const start = Date.now();
      const response = await axios.get(monitor.url, {
        timeout: 10000, // 10 second timeout
        validateStatus: () => true, // don't throw on 4xx/5xx, we handle it
      });
      responseTime = Date.now() - start;
      statusCode = response.status;

      // Consider 2xx and 3xx as UP
      if (statusCode >= 200 && statusCode < 400) {
        isUp = true;
        break; // success, no need to retry
      } else {
        lastError = `HTTP ${statusCode}`;
      }
    } catch (err) {
      lastError = err.message;
      // Wait 2 seconds before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  const newStatus = isUp ? 'UP' : 'DOWN';
  const previousStatus = monitor.status;

  // --- Save check result to history ---
  await CheckHistory.create({
    monitor: monitor._id,
    status: newStatus,
    responseTime: isUp ? responseTime : null,
    statusCode,
    error: isUp ? null : lastError,
    checkedAt: new Date(),
  });

  // --- Update monitor stats ---
  monitor.status = newStatus;
  monitor.lastCheckedAt = new Date();
  monitor.lastResponseTime = isUp ? responseTime : null;
  monitor.totalChecks += 1;
  if (isUp) monitor.successfulChecks += 1;

  await monitor.save();

  // --- Trigger alerts on status change ---
  await handleAlerts(monitor, previousStatus, newStatus);
}

/**
 * Decides whether to send an alert based on:
 * 1. Status changed (UP->DOWN or DOWN->UP)
 * 2. Cooldown period has passed (prevents alert spam)
 */
async function handleAlerts(monitor, previousStatus, newStatus) {
  const statusChanged = previousStatus !== newStatus && previousStatus !== 'PENDING';
  if (!statusChanged) return;

  const cooldownMs = (parseInt(process.env.ALERT_COOLDOWN_MINUTES) || 10) * 60 * 1000;
  const now = Date.now();

  // Check cooldown: don't send if we already alerted recently
  if (monitor.lastAlertSentAt && now - monitor.lastAlertSentAt.getTime() < cooldownMs) {
    console.log(`[Alert] Cooldown active for ${monitor.url}, skipping alert.`);
    return;
  }

  // Fetch user email for the alert
  const populatedMonitor = await monitor.populate('user', 'email name');

  await sendAlert({
    to: populatedMonitor.user.email,
    userName: populatedMonitor.user.name,
    monitorName: monitor.name,
    url: monitor.url,
    status: newStatus,
  });

  // Record when we last sent an alert
  monitor.lastAlertSentAt = new Date();
  await monitor.save();
}

module.exports = { checkMonitor };
