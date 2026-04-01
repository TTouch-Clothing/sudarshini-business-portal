import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  rawPhone: String,
  address: String,
  totalOrders: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  firstOrderDate: Date,
  lastOrderDate: Date,
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
