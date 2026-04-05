const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function formatMoney(value) {
  const num = Number(value || 0);
  return `${num.toFixed(2)}৳`;
}

function escapeDiscord(text = "") {
  return String(text).replace(/([\\_*`~|>])/g, "\\$1");
}

function decodeHtmlEntities(text = "") {
  return String(text)
    .replace(/&#2547;|&#x09F3;|&bdt;|&taka;/gi, "৳")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(text = "") {
  return String(text).replace(/<[^>]*>/g, " ");
}

function cleanText(text = "") {
  return decodeHtmlEntities(stripHtml(text))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDeliveryText(text = "") {
  let cleaned = cleanText(text);

  cleaned = cleaned.replace(
    /^\s*\d+(?:\.\d{1,2})?\s*৳?\s*(?:[-•:]?\s*)?(via\s+)/i,
    "$1"
  );

  cleaned = cleaned.replace(
    /\s*[-–—]\s*\d+(?:\.\d{1,2})?\s*৳\s*$/i,
    ""
  );

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned || "-";
}

function truncate(text = "", max = 1024) {
  const str = String(text || "");
  if (str.length <= max) return str;
  return `${str.slice(0, max - 3)}...`;
}

function isValidImageUrl(url = "") {
  return /^https?:\/\/.+/i.test(cleanText(url));
}

function normalizeImageUrl(url = "") {
  const cleaned = cleanText(url);
  if (!cleaned) return "";
  try {
    return encodeURI(cleaned);
  } catch {
    return cleaned;
  }
}

function buildSearchableContent(order) {
  const orderId = cleanText(order.orderId || "-");
  const phone = cleanText(order.phone || "-");
  const customer = cleanText(order.customerName || "-");

  const skuText = Array.isArray(order.items)
    ? order.items
        .map((item) => cleanText(item?.sku || ""))
        .filter(Boolean)
        .join(", ")
    : "-";

  const productText = Array.isArray(order.items)
    ? order.items
        .map((item) => cleanText(item?.productName || ""))
        .filter(Boolean)
        .join(", ")
    : "-";

  return [
    `Order: ${orderId}`,
    `Customer: ${customer}`,
    `Phone: ${phone}`,
    `SKU: ${skuText}`,
    `Products: ${productText}`,
  ].join(" | ");
}

function buildMainOrderEmbed(order) {
  const itemsName =
    Array.isArray(order.items) && order.items.length
      ? order.items
          .map(
            (item) =>
              `${cleanText(item.productName || "Unknown Product")} × ${Number(
                item.quantity || 0
              )}`
          )
          .join("\n")
      : "-";

  const deliveryText = cleanDeliveryText(order.deliveryText || "-");
  const deliveryValue =
    order.deliveryCharge != null
      ? `${deliveryText} • ${formatMoney(order.deliveryCharge)}`
      : deliveryText;

  return {
    title: `🛒 New Order ${cleanText(order.orderId || "")}`,
    color: 0x2f3136,
    fields: [
      {
        name: "Items Name",
        value: truncate(escapeDiscord(itemsName), 1024) || "-",
        inline: false,
      },
      {
        name: "Customer Name",
        value:
          truncate(escapeDiscord(cleanText(order.customerName || "-")), 1024) ||
          "-",
        inline: true,
      },
      {
        name: "Phone",
        value:
          truncate(escapeDiscord(cleanText(order.phone || "-")), 1024) || "-",
        inline: true,
      },
      {
        name: "Address",
        value:
          truncate(escapeDiscord(cleanText(order.address || "-")), 1024) || "-",
        inline: false,
      },
      {
        name: "Order Note",
        value:
          truncate(escapeDiscord(cleanText(order.orderNote || "-")), 1024) ||
          "-",
        inline: false,
      },
      {
        name: "Product Price",
        value: formatMoney(order.productPrice),
        inline: true,
      },
      {
        name: "Delivery Charge",
        value: formatMoney(order.deliveryCharge),
        inline: true,
      },
      {
        name: "Total",
        value: formatMoney(order.total),
        inline: true,
      },
      {
        name: "Delivery",
        value: truncate(escapeDiscord(deliveryValue), 1024) || "-",
        inline: false,
      },
      {
        name: "Payment",
        value:
          truncate(escapeDiscord(cleanText(order.paymentMethod || "-")), 1024) ||
          "-",
        inline: false,
      },
    ],
    footer: {
      text: `${cleanText(order.source || "Website")} • ${
        cleanText(order.orderDateText || "") ||
        new Date(order.orderDate || Date.now()).toLocaleString()
      }`,
    },
  };
}

function buildItemEmbed(item) {
  const productName = cleanText(item.productName || "Product");
  const sku = cleanText(item.sku || "-");
  const quantity = Number(item.quantity || 0);
  const imageUrl = normalizeImageUrl(item.imageUrl || "");

  return {
    title: productName,
    color: 0x2f3136,
    fields: [
      {
        name: "SKU",
        value: truncate(escapeDiscord(sku), 1024) || "-",
        inline: true,
      },
      {
        name: "Quantity",
        value: `× ${quantity}`,
        inline: true,
      },
    ],
    image: isValidImageUrl(imageUrl) ? { url: imageUrl } : undefined,
  };
}

async function postToDiscord(body) {
  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

  const embeds = [buildMainOrderEmbed(order)];

  if (Array.isArray(order.items) && order.items.length) {
    for (const item of order.items.slice(0, 9)) {
      embeds.push(buildItemEmbed(item));
    }
  }

  await postToDiscord({
    username: "WooCommerce",
    content: buildSearchableContent(order),
    embeds,
  });
}
