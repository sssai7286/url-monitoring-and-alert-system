const { validationResult } = require('express-validator');
const Monitor = require('../models/Monitor');
const CheckHistory = require('../models/CheckHistory');
const { checkMonitor } = require('../services/monitorChecker');

// GET /api/monitors — list all monitors for the logged-in user
async function getMonitors(req, res, next) {
  try {
    const monitors = await Monitor.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(monitors);
  } catch (err) {
    next(err);
  }
}

// POST /api/monitors — create a new monitor
async function createMonitor(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, url, interval } = req.body;

    const monitor = await Monitor.create({
      user: req.user.id,
      name,
      url,
      interval: interval || 5,
    });

    // Run an immediate check so the user sees status right away
    checkMonitor(monitor).catch(console.error);

    res.status(201).json(monitor);
  } catch (err) {
    next(err);
  }
}

// PUT /api/monitors/:id — update a monitor
async function updateMonitor(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const monitor = await Monitor.findOne({ _id: req.params.id, user: req.user.id });
    if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

    const { name, url, interval, active } = req.body;
    if (name !== undefined) monitor.name = name;
    if (url !== undefined) monitor.url = url;
    if (interval !== undefined) monitor.interval = interval;
    if (active !== undefined) monitor.active = active;

    await monitor.save();
    res.json(monitor);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/monitors/:id — delete a monitor and its history
async function deleteMonitor(req, res, next) {
  try {
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

    // Clean up history records
    await CheckHistory.deleteMany({ monitor: req.params.id });

    res.json({ message: 'Monitor deleted' });
  } catch (err) {
    next(err);
  }
}

// POST /api/monitors/:id/check — manually trigger a check
async function triggerCheck(req, res, next) {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, user: req.user.id });
    if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

    await checkMonitor(monitor);

    // Return updated monitor
    const updated = await Monitor.findById(monitor._id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMonitors, createMonitor, updateMonitor, deleteMonitor, triggerCheck };
