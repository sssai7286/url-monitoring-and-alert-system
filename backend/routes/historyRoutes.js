const express = require('express');
const { protect } = require('../middleware/auth');
const { getHistory } = require('../controllers/historyController');

const router = express.Router();

router.use(protect);
router.get('/:monitorId', getHistory);

module.exports = router;
