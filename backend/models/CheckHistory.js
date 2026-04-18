const mongoose = require('mongoose');

// Each document represents one check result for a monitor
const checkHistorySchema = new mongoose.Schema(
  {
    monitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor', required: true },
    status: { type: String, enum: ['UP', 'DOWN'], required: true },
    responseTime: { type: Number }, // ms, null if DOWN
    statusCode: { type: Number },   // HTTP status code
    error: { type: String },        // error message if DOWN
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for fast queries by monitor + time
checkHistorySchema.index({ monitor: 1, checkedAt: -1 });

module.exports = mongoose.model('CheckHistory', checkHistorySchema);
