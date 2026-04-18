const CheckHistory = require('../models/CheckHistory');
const Monitor = require('../models/Monitor');

/**
 * GET /api/history/:monitorId
 * Returns the last N check results for a monitor.
 * Used to render the status history graph on the frontend.
 *
 * Uptime calculation:
 *   uptime% = (number of UP checks / total checks) * 100
 *   We calculate this from the last 100 records for accuracy.
 */
async function getHistory(req, res, next) {
  try {
    const { monitorId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verify ownership
    const monitor = await Monitor.findOne({ _id: monitorId, user: req.user.id });
    if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

    const history = await CheckHistory.find({ monitor: monitorId })
      .sort({ checkedAt: -1 })
      .limit(limit);

    // Calculate uptime from last 100 checks
    const last100 = await CheckHistory.find({ monitor: monitorId })
      .sort({ checkedAt: -1 })
      .limit(100);

    const upCount = last100.filter((h) => h.status === 'UP').length;
    const uptimePercentage = last100.length > 0
      ? ((upCount / last100.length) * 100).toFixed(2)
      : null;

    res.json({ history, uptimePercentage });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory };
