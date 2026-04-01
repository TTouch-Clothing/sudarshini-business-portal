import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import UserLog from "../models/UserLog.js";
import { sumItemQty } from "../utils/calc.js";

const DHAKA_TIMEZONE = "Asia/Dhaka";

function aggregateSku(orders) {
  const map = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const key = item.sku || item.productName;

      const row = map.get(key) || {
        sku: item.sku,
        productName: item.productName,
        imageUrl: item.imageUrl,
        totalQuantity: 0,
        orderCount: 0
      };

      row.totalQuantity += Number(item.quantity || 0);
      row.orderCount += 1;

      map.set(key, row);
    }
  }

  return [...map.values()];
}

function countOrders(orders) {
  return orders.length;
}

function sumAllQuantity(orders) {
  return orders.reduce((sum, order) => {
    return sum + sumItemQty(order.items);
  }, 0);
}

function sumAllRevenue(orders) {
  return orders.reduce((sum, order) => {
    return sum + Number(order.total || 0);
  }, 0);
}

function formatDhakaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day"))
  };
}

function formatDhakaDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatDhakaWeekday(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    weekday: "short"
  }).format(date);
}

function getDhakaDateShifted(daysAgo = 0) {
  const now = new Date();
  const parts = formatDhakaDateParts(now);

  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() - daysAgo);

  return base;
}

function getMonthShort(monthNumber) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  return months[monthNumber - 1];
}

function getTodayDayValue() {
  const today = formatDhakaDateParts(new Date());
  return `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDayPrefixFromValue(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${getMonthShort(month)} ${year}`;
}

function buildDayRegex(value) {
  const prefix = buildDayPrefixFromValue(value);
  return new RegExp(`^${escapeRegex(prefix)}\\s*,`, "i");
}

function buildMonthRegex(value) {
  const [year, month] = String(value).split("-").map(Number);
  const monthShort = getMonthShort(month);
  return new RegExp(`^\\d{1,2}\\s+${escapeRegex(monthShort)}\\s+${year}\\s*,`, "i");
}

function buildYearRegex(value) {
  const year = Number(value);
  return new RegExp(`^\\d{1,2}\\s+[A-Za-z]{3}\\s+${year}\\s*,`, "i");
}

function buildRegexByType(type, value) {
  if (type === "day") {
    return buildDayRegex(value || getTodayDayValue());
  }

  if (type === "month") {
    const today = formatDhakaDateParts(new Date());
    const fallback = `${today.year}-${String(today.month).padStart(2, "0")}`;
    return buildMonthRegex(value || fallback);
  }

  const fallbackYear = String(formatDhakaDateParts(new Date()).year);
  return buildYearRegex(value || fallbackYear);
}

async function findOrdersByOrderDateText(regex) {
  const orders = await Order.find({
    orderDateText: { $regex: regex }
  });

  orders.sort((a, b) => {
    const aTime = a.orderDate ? new Date(a.orderDate).getTime() : 0;
    const bTime = b.orderDate ? new Date(b.orderDate).getTime() : 0;
    return bTime - aTime;
  });

  return orders;
}

function normalizePhone(phone = "") {
  const cleaned = String(phone).replace(/\D/g, "");

  if (!cleaned) return "";

  if (cleaned.startsWith("880") && cleaned.length >= 13) {
    return "0" + cleaned.slice(3);
  }

  if (cleaned.startsWith("88") && cleaned.length >= 13) {
    return "0" + cleaned.slice(2);
  }

  return cleaned;
}

function buildCustomerRowsFromOrders(orders = []) {
  const map = new Map();

  for (const order of orders) {
    const phone = normalizePhone(order.normalizedPhone || order.phone || "");
    if (!phone) continue;

    const quantity = sumItemQty(order.items || []);
    const totalAmount = Number(order.total || 0);
    const currentTime = new Date(order.createdAt || order.orderDate || 0).getTime();

    if (!map.has(phone)) {
      map.set(phone, {
        _id: phone,
        customerName: order.customerName || "-",
        address: order.address || "-",
        phone,
        totalOrders: 0,
        totalQuantity: 0,
        totalAmount: 0,
        latestTime: currentTime
      });
    }

    const row = map.get(phone);

    row.totalOrders += 1;
    row.totalQuantity += quantity;
    row.totalAmount += totalAmount;

    if (currentTime >= row.latestTime) {
      row.customerName = order.customerName || row.customerName;
      row.address = order.address || row.address;
      row.latestTime = currentTime;
    }
  }

  return [...map.values()]
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .map(({ latestTime, ...rest }) => rest);
}

export async function summary(req, res) {
  const todayRegex = buildRegexByType("day", getTodayDayValue());
  const todayOrders = await findOrdersByOrderDateText(todayRegex);

  const allOrders = await Order.find({});
  const customerRows = buildCustomerRowsFromOrders(allOrders);
  const vipCount = customerRows.filter((c) => c.totalOrders > 5).length;

  const newCustomers = new Set(
    todayOrders
      .map((o) => normalizePhone(o.normalizedPhone || o.phone))
      .filter(Boolean)
  ).size;

  const skuRows = aggregateSku(todayOrders).sort((a, b) => b.totalQuantity - a.totalQuantity);

  const daily = [];

  for (let i = 6; i >= 0; i--) {
    const dhakaDate = getDhakaDateShifted(i);
    const parts = formatDhakaDateParts(dhakaDate);
    const dayValue = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;

    const regex = buildRegexByType("day", dayValue);
    const orders = await findOrdersByOrderDateText(regex);

    daily.push({
      label: formatDhakaWeekday(dhakaDate),
      revenue: sumAllRevenue(orders)
    });
  }

  res.json({
    today: {
      dateLabel: formatDhakaDateLabel(new Date()),
      orders: countOrders(todayOrders),
      quantity: sumAllQuantity(todayOrders),
      revenue: sumAllRevenue(todayOrders)
    },
    overview: daily,
    vipCustomers: vipCount,
    newCustomers,
    latestOrders: todayOrders.slice(0, 5),
    topSellingSkus: skuRows.slice(0, 5),
    leastSellingProducts: [...skuRows]
      .sort((a, b) => a.totalQuantity - b.totalQuantity)
      .slice(0, 5),
    leastOrders: skuRows.length ? skuRows[skuRows.length - 1]?.orderCount || 0 : 0
  });
}

export async function customers(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const rows = buildCustomerRowsFromOrders(orders);
    res.json(rows);
  } catch (error) {
    console.error("customers error:", error);
    res.status(500).json({ message: "Failed to load customers" });
  }
}

export async function vipCustomers(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const rows = buildCustomerRowsFromOrders(orders).filter(
      (row) => row.totalOrders > 5
    );
    res.json(rows);
  } catch (error) {
    console.error("vipCustomers error:", error);
    res.status(500).json({ message: "Failed to load VIP customers" });
  }
}

async function getPeriodOrders(type, value) {
  const regex = buildRegexByType(type, value);
  const orders = await findOrdersByOrderDateText(regex);

  return {
    orders,
    start: null,
    end: null
  };
}

export async function periodSummary(req, res) {
  const { type } = req.params;
  const value = req.query.value;

  const { orders, start, end } = await getPeriodOrders(type, value);
  const skuRows = aggregateSku(orders).sort((a, b) => b.totalQuantity - a.totalQuantity);

  res.json({
    range: { start, end },
    totalOrders: countOrders(orders),
    totalQuantity: sumAllQuantity(orders),
    totalRevenue: sumAllRevenue(orders),
    bestProducts: skuRows,
    orders
  });
}

export async function logs(req, res) {
  const rows = await UserLog.find().sort({ createdAt: -1 }).limit(200);
  res.json(rows);
}