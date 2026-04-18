const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  triggerCheck,
} = require('../controllers/monitorController');

const router = express.Router();

// All monitor routes require authentication
router.use(protect);

const urlValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('url').optional().isURL({ require_protocol: true }).withMessage('Valid URL with protocol required'),
  body('interval').optional().isIn([1, 5, 10, 30, 60]).withMessage('Interval must be 1, 5, 10, 30, or 60'),
];

router.get('/', getMonitors);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('url').isURL({ require_protocol: true }).withMessage('Valid URL with protocol required'),
  ...urlValidation,
], createMonitor);
router.put('/:id', urlValidation, updateMonitor);
router.delete('/:id', deleteMonitor);
router.post('/:id/check', triggerCheck);

module.exports = router;
