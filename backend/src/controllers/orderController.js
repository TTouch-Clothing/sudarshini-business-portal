import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import { normalizePhone } from "../utils/normalizePhone.js";
import { sumItemQty } from "../utils/calc.js";
import { logAction } from "../utils/logAction.js";
import { sendDiscordOrderWebhook } from "../utils/sendDiscordOrderWebhook.js";

function parseOrderDateText(orderDateText) {
  if (!orderDateText) return null;

  const text = String(orderDateText).trim();
  const match = text.match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (!match) return null;

  const [, dayStr, monthStr, yearStr, hourStr, minuteStr, ampmRaw] = match;

  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const month = months[monthStr.toLowerCase()];
  if (month === undefined) return null;

  const day = Number(dayStr);
  const year = Number(yearStr);
  let hour = Number(hourStr);
  const minute = Number(minuteStr);
  const ampm = ampmRaw.toUpperCase();

  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const utcMs = Date.UTC(year, month, day, hour - 6, minute, 0, 0);
  const date = new Date(utcMs);

  return Number.isNaN(date.getTime()) ? null : date;
}

async function syncCustomerFromOrder(order) {
  const phone = normalizePhone(order.phone);
  if (!phone) return;

  const qty = sumItemQty(order.items);
  const existing = await Customer.findOne({ phone });

  if (!existing) {
    await Customer.create({
      name: order.customerName,
      phone,
      rawPhone: order.phone,
      address: order.address,
      totalOrders: 1,
      totalQuantity: qty,
      totalAmount: order.total || 0,
      firstOrderDate: order.orderDate,
      lastOrderDate: order.orderDate,
    });
    return;
  }

  const allOrders = await Order.find({ normalizedPhone: phone }).sort({ orderDate: 1 });

  existing.name = order.customerName || existing.name;
  existing.rawPhone = order.phone || existing.rawPhone;
  existing.address = order.address || existing.address;
  existing.totalOrders = allOrders.length;
  existing.totalQuantity = allOrders.reduce((s, o) => s + sumItemQty(o.items), 0);
  existing.totalAmount = allOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  existing.firstOrderDate = allOrders[0]?.orderDate || existing.firstOrderDate;
  existing.lastOrderDate = allOrders[allOrders.length - 1]?.orderDate || existing.lastOrderDate;

  await existing.save();
}

export async function syncOrder(req, res) {
  try {
    if (req.headers["x-sync-secret"] !== process.env.SYNC_SECRET) {
      return res.status(401).json({ message: "Invalid sync secret" });
    }

    const payload = { ...req.body };
    payload.normalizedPhone = normalizePhone(payload.phone);

    const parsedFromText = parseOrderDateText(payload.orderDateText);

    if (parsedFromText) {
      payload.orderDate = parsedFromText;
    } else if (payload.orderDate) {
      const parsedDate = new Date(payload.orderDate);
      payload.orderDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    } else {
      payload.orderDate = new Date();
    }

    const existingOrder = await Order.findOne({ orderId: payload.orderId });

    const order = await Order.findOneAndUpdate(
      { orderId: payload.orderId },
      payload,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    await syncCustomerFromOrder(order);

    if (!existingOrder) {
      try {
        // Save first -> read final DB data -> send to Discord
        const savedOrder = await Order.findById(order._id).lean();

        console.log(
          "DISCORD IMAGE CHECK:",
          savedOrder?.items?.map((item) => ({
            sku: item.sku,
            imageUrl: item.imageUrl,
          }))
        );

        await sendDiscordOrderWebhook(savedOrder);
      } catch (discordError) {
        console.error("Discord webhook error:", discordError.message);
      }
    }

    return res.status(201).json({
      message: "Order synced",
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("syncOrder error:", error);
    return res.status(500).json({ message: "Failed to sync order" });
  }
}

export async function listOrders(req, res) {
  const { search = "" } = req.query;

  const filter = search
    ? {
        $or: [
          { orderId: new RegExp(search, "i") },
          { customerName: new RegExp(search, "i") },
          { phone: new RegExp(search, "i") },
        ],
      }
    : {};

  const orders = await Order.find(filter);

  orders.sort((a, b) => {
    const aNum = Number(String(a.orderId || "").replace(/\D/g, ""));
    const bNum = Number(String(b.orderId || "").replace(/\D/g, ""));
    return bNum - aNum;
  });

  res.json(orders);
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
}

export async function updateOrder(req, res) {
  const updateData = { ...req.body };

  if (updateData.orderDateText) {
    const parsedFromText = parseOrderDateText(updateData.orderDateText);
    if (parsedFromText) {
      updateData.orderDate = parsedFromText;
    }
  }

  const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  await syncCustomerFromOrder(order);
  await logAction({
    userName: req.user.name,
    action: `Edit Order ${order.orderId}`,
    ipAddress: req.ip,
  });

  res.json(order);
}

export async function deleteOrder(req, res) {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const phone = order.normalizedPhone;
  await order.deleteOne();

  if (phone) {
    const orders = await Order.find({ normalizedPhone: phone }).sort({ orderDate: 1 });
    const customer = await Customer.findOne({ phone });

    if (customer) {
      if (!orders.length) {
        await customer.deleteOne();
      } else {
        customer.totalOrders = orders.length;
        customer.totalQuantity = orders.reduce((s, o) => s + sumItemQty(o.items), 0);
        customer.totalAmount = orders.reduce((s, o) => s + Number(o.total || 0), 0);
        customer.firstOrderDate = orders[0].orderDate;
        customer.lastOrderDate = orders[orders.length - 1].orderDate;
        await customer.save();
      }
    }
  }

  await logAction({
    userName: req.user.name,
    action: `Delete Order ${order.orderId}`,
    ipAddress: req.ip,
  });

  res.json({ message: "Order deleted" });
}
