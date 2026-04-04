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

export async function forecast(req, res) {
  try {
    const allOrders = await Order.find({}, { orderDate: 1, items: 1 }).lean();

    const today = toDhakaDate();
    const todayEnd = endOfDay(today);

    const fiveDayRange = getCurrentFiveDayBlockRange(today);
    const monthRange = getCurrentMonthRange(today);

    const last7Start = startOfDay(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    );

    const last30Start = startOfDay(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
    );

    const skuStats = new Map();

    for (const order of allOrders) {
      const orderDate = toDhakaDate(order.orderDate);

      for (const item of order.items || []) {
        const key = item.sku || item.productName;
        if (!key) continue;

        if (!skuStats.has(key)) {
          skuStats.set(key, {
            key,
            sku: item.sku || '',
            productName: item.productName || 'Unknown Product',
            imageUrl: item.imageUrl || item.image || '',
            fiveDayActual: 0,
            monthActual: 0,
            last7Qty: 0,
            last30Qty: 0,
          });
        }

        const stat = skuStats.get(key);
        const qty = Number(item.quantity || 0);

        if (orderDate >= fiveDayRange.start && orderDate <= fiveDayRange.end) {
          stat.fiveDayActual += qty;
        }

        if (orderDate >= monthRange.start && orderDate <= monthRange.end) {
          stat.monthActual += qty;
        }

        if (orderDate >= last7Start && orderDate <= todayEnd) {
          stat.last7Qty += qty;
        }

        if (orderDate >= last30Start && orderDate <= todayEnd) {
          stat.last30Qty += qty;
        }
      }
    }

    const rows = Array.from(skuStats.values())
      .map((stat) => {
        const recent7 = stat.last7Qty / 7;
        const recent30 = stat.last30Qty / 30;

        const predictedDaily = recent7 * 0.6 + recent30 * 0.4;

        const expectedFiveDay = Math.round(
          predictedDaily * fiveDayRange.totalDays
        );
        const expectedMonth = Math.round(
          predictedDaily * monthRange.totalDays
        );

        return {
          sku: stat.sku,
          productName: stat.productName,
          imageUrl: stat.imageUrl,
          image: stat.imageUrl,

          fiveDay: {
            rangeLabel: fiveDayRange.label,
            expected: expectedFiveDay,
            actual: stat.fiveDayActual,
          },

          month: {
            rangeLabel: monthRange.label,
            expected: expectedMonth,
            actual: stat.monthActual,
          },

          status:
            expectedMonth >= 100
              ? 'Fast'
              : expectedMonth >= 40
              ? 'Normal'
              : 'Slow',
        };
      })
      .sort((a, b) => b.month.expected - a.month.expected);

    return res.json({
      items: rows.slice(0, 10),
      allItems: rows,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return res.status(500).json({
      message: 'Failed to generate forecast',
    });
  }
}