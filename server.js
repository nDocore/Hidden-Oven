require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

const LINE_API = 'https://api.line.me/v2/bot/message/push';
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const ADMIN_USER_ID = process.env.LINE_USER_ID;
const ADMIN_ORDER_URL = process.env.ADMIN_ORDER_URL || 'https://yourdomain.com/admin/orders/';

/**
 * Helper to generate LINE Flex Message bubble
 */
function createOrderFlexMessage(order) {
    const contents = [
        {
            "type": "text",
            "text": "📦 มีออเดอร์ใหม่",
            "weight": "bold",
            "size": "lg",
            "color": "#D4AF37"
        },
        {
            "type": "text",
            "text": `Order ID: ${order.order_id}`,
            "size": "xs",
            "color": "#999999",
            "margin": "xs"
        },
        {
            "type": "text",
            "text": `ลูกค้า: ${order.customer_name}`,
            "size": "sm",
            "weight": "bold",
            "margin": "md"
        },
        { "type": "separator", "margin": "lg" },
        {
            "type": "text",
            "text": "🧾 รายการสินค้า",
            "weight": "bold",
            "size": "sm",
            "margin": "lg"
        },
        {
            "type": "text",
            "text": order.order_items,
            "wrap": true,
            "size": "sm",
            "color": "#333333",
            "margin": "xs"
        }
    ];

    // Optional Note section
    if (order.customer_note && order.customer_note.trim() !== "") {
        contents.push(
            { "type": "separator", "margin": "lg" },
            {
                "type": "text",
                "text": "📝 Note ลูกค้า",
                "weight": "bold",
                "size": "sm",
                "margin": "lg"
            },
            {
                "type": "text",
                "text": order.customer_note,
                "wrap": true,
                "size": "sm",
                "color": "#555555",
                "margin": "xs"
            }
        );
    }

    // Add Pickup and Price
    contents.push(
        {
            "type": "text",
            "text": `⏰ เวลารับสินค้า: ${order.pickup_time}`,
            "size": "sm",
            "margin": "lg"
        },
        { "type": "separator", "margin": "lg" },
        {
            "type": "box",
            "layout": "horizontal",
            "contents": [
                { "type": "text", "text": "ยอดรวม", "weight": "bold", "size": "md" },
                { "type": "text", "text": `฿${order.total_price}`, "weight": "bold", "size": "md", "align": "end", "color": "#D4AF37" }
            ],
            "margin": "lg"
        }
    );

    return {
        "type": "bubble",
        "styles": { "footer": { "separator": true } },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": contents
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "color": "#2C1810",
                    "action": {
                        "type": "uri",
                        "label": "เปิดหน้า Admin",
                        "uri": `${ADMIN_ORDER_URL}${order.order_id}`
                    }
                }
            ]
        }
    };
}

/**
 * Send push message with retry logic (3 attempts)
 */
async function sendLineMessage(payload, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(LINE_API, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: ADMIN_USER_ID,
                    messages: [
                        {
                            "type": "flex",
                            "altText": "มีออเดอร์ใหม่ - Hidden Oven",
                            "contents": payload
                        }
                    ]
                })
            });

            if (response.ok) {
                console.log(`[LINE] Message sent successfully (Order: ${payload.body.contents[1].text})`);
                return true;
            } else {
                const error = await response.text();
                console.error(`[LINE] API Error (Attempt ${i + 1}/${retries}):`, error);
            }
        } catch (err) {
            console.error(`[LINE] Network Error (Attempt ${i + 1}/${retries}):`, err.message);
        }

        if (i < retries - 1) {
            console.log(`[LINE] Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return false;
}

/**
 * Webhook Endpoint
 */
app.post('/webhook/order-created', async (req, res) => {
    const order = req.body;

    // Validation
    if (!order || !order.order_id) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    console.log(`[Webhook] Received order: ${order.order_id}`);

    const flexBubble = createOrderFlexMessage(order);
    const success = await sendLineMessage(flexBubble);

    if (success) {
        res.status(200).json({ message: 'Notification sent' });
    } else {
        res.status(500).json({ error: 'Failed to send notification after retries' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Server] HIDDEN OVEN Webhook running on port ${PORT}`);
});
