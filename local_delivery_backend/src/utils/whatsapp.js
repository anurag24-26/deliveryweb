// utils/whatsapp.js
// Free tier: 1000 conversations/month via Meta WhatsApp Cloud API

const axios = require("axios");

const WA_TOKEN = process.env.WHATSAPP_TOKEN;       // from Meta Developer Console
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID; // your WhatsApp sender phone ID
const WA_API_URL = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;

/**
 * Send a plain text WhatsApp message
 * @param {string} to - recipient phone number with country code e.g. "919876543210"
 * @param {string} message - text to send
 */
async function sendWhatsApp(to, message) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.warn("⚠️  WhatsApp not configured — skipping notification");
    return;
  }

  // Ensure number has country code, no + or spaces
  const cleaned = to.replace(/\D/g, "");
  const phone = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

  try {
    await axios.post(
      WA_API_URL,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`✅ WhatsApp sent to ${phone}`);
  } catch (err) {
    // Never crash the order flow because of a notification failure
    console.error("❌ WhatsApp send failed:", err.response?.data || err.message);
  }
}

/**
 * Notify user that their order was placed
 */
async function notifyUserOrderPlaced(userPhone, orderDetails) {
  const { orderId, restaurantName, total, items } = orderDetails;
  const itemList = items.map(i => `• ${i.name} x${i.quantity}`).join("\n");

  const message =
    `✅ *Order Placed Successfully!*\n\n` +
    `🍽️ Restaurant: ${restaurantName}\n` +
    `🆔 Order ID: #${String(orderId).slice(-6).toUpperCase()}\n\n` +
    `📋 Items:\n${itemList}\n\n` +
    `💰 Total: ₹${total}\n\n` +
    `We'll notify you when the restaurant confirms your order. Thank you! 🙏`;

  await sendWhatsApp(userPhone, message);
}

/**
 * Notify restaurant owner that a new order arrived
 */
async function notifyRestaurantNewOrder(restaurantPhone, orderDetails) {
  const { orderId, userName, total, items, deliveryAddress } = orderDetails;
  const itemList = items.map(i => `• ${i.name} x${i.quantity} — ₹${i.price * i.quantity}`).join("\n");

  const message =
    `🍽️ *New Order Received!*\n\n` +
    `🆔 Order ID: #${String(orderId).slice(-6).toUpperCase()}\n` +
    `👤 Customer: ${userName}\n\n` +
    `📋 Items:\n${itemList}\n\n` +
    `💰 Total: ₹${total}\n` +
    `📍 Delivery: ${deliveryAddress || "Address on file"}\n\n` +
    `Please confirm this order promptly! ⚡`;

  await sendWhatsApp(restaurantPhone, message);
}

/**
 * Notify user when order status changes
 */
async function notifyUserStatusUpdate(userPhone, status, restaurantName, orderId) {
  const statusMessages = {
    CONFIRMED:        `✅ *Order Confirmed!*\n\n🍽️ ${restaurantName} has confirmed your order #${String(orderId).slice(-6).toUpperCase()}.\n\nThey're getting ready to prepare it! 🔥`,
    PREPARING:        `👨‍🍳 *Order Being Prepared!*\n\n🍽️ ${restaurantName} is now preparing your order #${String(orderId).slice(-6).toUpperCase()}.\n\nHang tight, food is being made fresh! 🥘`,
    OUT_FOR_DELIVERY: `🛵 *Out for Delivery!*\n\nYour order #${String(orderId).slice(-6).toUpperCase()} from ${restaurantName} is on its way!\n\nGet ready to enjoy your meal! 🎉`,
    DELIVERED:        `📦 *Order Delivered!*\n\nYour order #${String(orderId).slice(-6).toUpperCase()} from ${restaurantName} has been delivered.\n\nEnjoy your meal! 😋 Please rate your experience.`,
    CANCELLED:        `❌ *Order Cancelled*\n\nYour order #${String(orderId).slice(-6).toUpperCase()} from ${restaurantName} has been cancelled.\n\nIf you have questions, please contact support.`
  };

  const message = statusMessages[status];
  if (message) await sendWhatsApp(userPhone, message);
}

module.exports = {
  notifyUserOrderPlaced,
  notifyRestaurantNewOrder,
  notifyUserStatusUpdate
};