import Order from '../models/Order.js';

const DHAKA_TIMEZONE = 'Asia/Dhaka';

function toDhakaDate(date = new Date()) {
  return new Date(
    new Date(date).toLocaleString('en-US', { timeZone: DHAKA_TIMEZONE })
  );
}

function startOfDay(date) {
  const d = toDhakaDate(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = toDhakaDate(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatRangeLabel(start, end) {
  return `${start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: DHAKA_TIMEZONE,
  })} - ${end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: DHAKA_TIMEZONE,
  })}`;
}

function getCurrentFiveDayBlockRange(baseDate = new Date()) {
  const now = toDhakaDate(baseDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  let startDay = 1;
  let endDay = 5;

  if (today <= 5) {
    startDay = 1;
    endDay = 5;
  } else if (today <= 10) {
    startDay = 6;
    endDay = 10;
  } else if (today <= 15) {
    startDay = 11;
    endDay = 15;
  } else if (today <= 20) {
    startDay = 16;
    endDay = 20;
  } else if (today <= 25) {
    startDay = 21;
    endDay = 25;
  } else {
    startDay = 26;
    endDay = lastDayOfMonth;
  }

  const start = startOfDay(new Date(year, month, startDay));
  const end = endOfDay(new Date(year, month, endDay));

  return {
    start,
    end,
    label: formatRangeLabel(start, end),
    totalDays: endDay - startDay + 1,
  };
}

function getCurrentMonthRange(baseDate = new Date()) {
  const now = toDhakaDate(baseDate);
  const year = now.getFullYear();
  const month = now.getMonth();

  const start = startOfDay(new Date(year, month, 1));
  const end = endOfDay(new Date(year, month + 1, 0));

  return {
    start,
    end,
    label: formatRangeLabel(start, end),
    totalDays: end.getDate(),
  };
}

function qtyForKeyInRange(orders, key, start, end) {
  return orders
    .filter((order) => {
      const orderDate = toDhakaDate(order.orderDate);
      return orderDate >= start && orderDate <= end;
    })
    .reduce((sum, order) => {
      const qty = (order.items || []).reduce((itemSum, item) => {
        const itemKey = item.sku || item.productName;
        if (itemKey !== key) return itemSum;
        return itemSum + Number(item.quantity || 0);
      }, 0);

      return sum + qty;
    }, 0);
}

function getSameWeekdayAverage(orders, key, today) {
  const targetWeekday = today.getDay();
  let total = 0;
  let count = 0;

  for (let i = 7; i <= 28; i += 7) {
    const d = toDhakaDate(today);
    d.setDate(d.getDate() - i);

    if (d.getDay() !== targetWeekday) continue;

    const dayStart = startOfDay(d);
    const dayEnd = endOfDay(d);

    total += qtyForKeyInRange(orders, key, dayStart, dayEnd);
    count += 1;
  }

  return count ? total / count : 0;
}

export async function forecast(req, res) {
  try {
    const allOrders = await Order.find().sort({ orderDate: 1 });

    const skuMap = new Map();

    for (const order of allOrders) {
      for (const item of order.items || []) {
        const key = item.sku || item.productName;
        if (!key) continue;

        if (!skuMap.has(key)) {
          skuMap.set(key, {
            key,
            sku: item.sku || '',
            productName: item.productName || 'Unknown Product',
            imageUrl: item.imageUrl || '',
          });
        }
      }
    }

    const today = toDhakaDate();
    const todayStart = startOfDay(today);

    const fiveDayRange = getCurrentFiveDayBlockRange(today);
    const monthRange = getCurrentMonthRange(today);

    const rows = [...skuMap.values()]
      .map((row) => {
        const actualFiveDay = qtyForKeyInRange(
          allOrders,
          row.key,
          fiveDayRange.start,
          fiveDayRange.end
        );

        const actualMonth = qtyForKeyInRange(
          allOrders,
          row.key,
          monthRange.start,
          monthRange.end
        );

        const last7Start = startOfDay(
          new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
        );

        const last30Start = startOfDay(
          new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
        );

        const actual7 = qtyForKeyInRange(allOrders, row.key, last7Start, endOfDay(today));
        const actual30 = qtyForKeyInRange(allOrders, row.key, last30Start, endOfDay(today));

        const recent7 = actual7 / 7;
        const recent30 = actual30 / 30;
        const weekdayAvg = getSameWeekdayAverage(allOrders, row.key, todayStart) || recent7;

        const predictedDaily = recent7 * 0.5 + recent30 * 0.3 + weekdayAvg * 0.2;

        const expectedFiveDay = Math.round(predictedDaily * fiveDayRange.totalDays);
        const expectedMonth = Math.round(predictedDaily * monthRange.totalDays);

        return {
          sku: row.sku,
          productName: row.productName,
          imageUrl: row.imageUrl,

          fiveDay: {
            rangeLabel: fiveDayRange.label,
            expected: expectedFiveDay,
            actual: actualFiveDay,
          },

          month: {
            rangeLabel: monthRange.label,
            expected: expectedMonth,
            actual: actualMonth,
          },

          status:
            expectedMonth >= 100 ? 'Fast' : expectedMonth >= 40 ? 'Normal' : 'Slow',
        };
      })
      .sort((a, b) => b.month.expected - a.month.expected);

    res.json({
      items: rows.slice(0, 10),
      allItems: rows,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      message: 'Failed to generate forecast',
    });
  }
}