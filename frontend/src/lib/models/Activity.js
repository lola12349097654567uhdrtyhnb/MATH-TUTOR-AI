import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  username: { type: String, required: true },
  topic: { type: String, default: null },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  cleared: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  remark: { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
