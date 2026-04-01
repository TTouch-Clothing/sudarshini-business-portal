import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  sku: String,
  productName: String,
  quantity: Number,
  imageUrl: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: String,
  phone: String,
  normalizedPhone: { type: String, index: true },
  address: String,
  orderNote: String,
  productPrice: Number,
  deliveryCharge: Number,
  total: Number,
  deliveryText: String,
  paymentMethod: String,
  source: String,
  orderDateText: String,
  orderDate: { type: Date, index: true },
  items: [itemSchema],
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
