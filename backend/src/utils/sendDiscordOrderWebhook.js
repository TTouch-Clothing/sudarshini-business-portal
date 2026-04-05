const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function formatMoney(value) {
  const num = Number(value || 0);
  return `${num.toFixed(2)}৳`;
}

function escapeDiscord(text = "") {
  return String(text).replace(/([\\_*`~|>])/g, "\\$1");
}

function buildMainOrderEmbed(order) {
  const itemsName = Array.isArray(order.items) && order.items.length
    ? order.items.map((item) => `${item.productName || "Unknown Product"} × ${item.quantity || 0}`).join("\n")
    : "-";

  return {
    title: `🛒 New Order ${order.orderId || ""}`,
    color: 0x2f3136,
    fields: [
      {
        name: "Items Name",
        value: escapeDiscord(itemsName).slice(0, 1024) || "-",
        inline: false
      },
      {
        name: "Customer Name",
        value: escapeDiscord(order.customerName || "-"),
        inline: true
      },
      {
        name: "Phone",
        value: escapeDiscord(order.phone || "-"),
        inline: true
      },
      {
        name: "Address",
        value: escapeDiscord(order.address || "-").slice(0, 1024) || "-",
        inline: false
      },
      {
        name: "Order Note",
        value: escapeDiscord(order.orderNote || "-").slice(0, 1024) || "-",
        inline: false
      },
      {
        name: "Product Price",
        value: formatMoney(order.productPrice),
        inline: true
      },
      {
        name: "Delivery Charge",
        value: formatMoney(order.deliveryCharge),
        inline: true
      },
      {
        name: "Total",
        value: formatMoney(order.total),
        inline: true
      },
      {
        name: "Delivery",
        value: escapeDiscord(
          `${order.deliveryText || "-"}${order.deliveryCharge != null ? ` • ${formatMoney(order.deliveryCharge)}` : ""}`
        ).slice(0, 1024) || "-",
        inline: false
      },
      {
        name: "Payment",
        value: escapeDiscord(order.paymentMethod || "-"),
        inline: false
      }
    ],
    footer: {
      text: `${order.source || "Website"} • ${order.orderDateText || new Date(order.orderDate || Date.now()).toLocaleString()}`
    }
  };
}

function buildItemEmbed(item) {
  return {
    title: item.productName || "Product",
    color: 0x2f3136,
    fields: [
      {
        name: "SKU",
        value: escapeDiscord(item.sku || "-"),
        inline: true
      },
      {
        name: "Quantity",
        value: `× ${Number(item.quantity || 0)}`,
        inline: true
      }
    ],
    image: item.imageUrl ? { url: item.imageUrl } : undefined
  };
}

async function postToDiscord(body) {
  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Discord webhook failed: ${response.status} ${text}`);
  }
}

export async function sendDiscordOrderWebhook(order) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("DISCORD_WEBHOOK_URL is not set");
    return;
  }

  await postToDiscord({
    username: "WooCommerce",
    embeds: [buildMainOrderEmbed(order)]
  });

  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      await postToDiscord({
        username: "WooCommerce",
        embeds: [buildItemEmbed(item)]
      });
    }
  }
}