import mongoose from 'mongoose';

const userLogSchema = new mongoose.Schema({
  userName: String,
  action: String,
  ipAddress: String,
}, { timestamps: true });

export default mongoose.model('UserLog', userLogSchema);
