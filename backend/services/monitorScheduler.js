const cron = require('node-cron');
const Monitor = require('../models/Monitor');
const { checkMonitor } = require('./monitorChecker');

/**
 * How the scheduler works:
 * - Runs a cron job every minute (the smallest interval we support).
 * - Each minute, it fetches all active monitors from the DB.
 * - For each monitor, it checks if enough time has passed since the last check
 *   based on the monitor's configured interval.
 * - If yes, it fires checkMonitor() asynchronously (non-blocking).
 *
 * This approach is simple and scalable — no need for per-monitor timers.
 */
function startMonitoringScheduler() {
  console.log('[Scheduler] Starting monitoring scheduler...');

  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const monitors = await Monitor.find({ active: true });
      const now = Date.now();

      for (const monitor of monitors) {
        const intervalMs = monitor.interval * 60 * 1000;
        const lastChecked = monitor.lastCheckedAt ? monitor.lastCheckedAt.getTime() : 0;

        // Check if it's time to run this monitor
        if (now - lastChecked >= intervalMs) {
          // Fire and forget — don't await so monitors run in parallel
          checkMonitor(monitor).catch((err) =>
            console.error(`[Scheduler] Error checking ${monitor.url}:`, err.message)
          );
        }
      }
    } catch (err) {
      console.error('[Scheduler] Failed to fetch monitors:', err.message);
    }
  });

  console.log('[Scheduler] Monitoring scheduler started (runs every minute).');
}

module.exports = { startMonitoringScheduler };
