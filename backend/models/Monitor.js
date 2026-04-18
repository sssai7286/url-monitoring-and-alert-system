const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },

    // Interval in minutes: 1, 5, 10, 30, 60
    interval: { type: Number, default: 5, enum: [1, 5, 10, 30, 60] },

    // Current status
    status: { type: String, enum: ['UP', 'DOWN', 'PENDING'], default: 'PENDING' },

    // Last check metadata
    lastCheckedAt: { type: Date },
    lastResponseTime: { type: Number }, // in ms

    // Uptime tracking counters
    totalChecks: { type: Number, default: 0 },
    successfulChecks: { type: Number, default: 0 },

    // Alert cooldown: timestamp of last alert sent
    lastAlertSentAt: { type: Date },

    // Whether monitoring is active
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: uptime percentage
monitorSchema.virtual('uptimePercentage').get(function () {
  if (this.totalChecks === 0) return null;
  return ((this.successfulChecks / this.totalChecks) * 100).toFixed(2);
});

monitorSchema.set('toJSON', { virtuals: true });
monitorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Monitor', monitorSchema);
