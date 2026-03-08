const LINE_ACCESS_TOKEN = '4BxOv/4UOF5i/s61WZUWeDdyRBmB6dTRdz4pSOo01pruhdT5FPzR9f270XmkPdaixCntEVCCJg2Jd/Ll5BFYdz7daZHj5uJVSrA05zEf3aoNBScA/f5EdK8fd5VOXkZAZJvNcX8Dr8j4MJepUXFD2AdB04t89/1O/w1cDnyilFU=';
const ADMIN_USER_ID = 'U92d24276164f7f05e8e0bfab6cbaef05'; // User ID ของแอดมิน
const ADMIN_GROUP_ID = 'C1c8cf9730e31c63c74eb92bd6be13259'; // Group ID ของกลุ่มแอดมิน
const ADMIN_ORDER_URL = 'https://yourdomain.com/admin/orders/';

/**
 * 🛠️ การตั้งค่ากลุ่ม (Group Support):
 * 1. ไปที่ LINE Official Account Manager -> Settings -> Messaging API
 * 2. ตรง "Allow group or multi-person chats" ปรับเป็น "Enabled" แล้ว Save
 * 3. ดึง Bot เข้ากลุ่ม แล้วพิมพ์คำว่า "id" ในกลุ่ม
 * 4. Bot จะบอกรหัสกลุ่มมา ให้เอารหัสนั้นมาเปลี่ยนค่าใน ADMIN_USER_ID ด้านบนครับ
 */
function setup() {
    const folder = getOrCreateFolder("HiddenOvenSlips");
    console.log("ยินดีด้วย! ระบบได้รับอนุญาตให้เข้าถึง Drive แล้ว: " + folder.getName());
}

/**
 * Version 18: Multi-Admin Group Support
 */
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // 🌐 Case 1: มาจากเว็บไซต์ (ส่งแจ้งเตือนออเดอร์)
        if (data.event === 'order_created') {
            const result = createOrderFlex(data);
            sendToLine(result.flexPayload, result.imageUrl);
            return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
        }

        // 💬 Case 2: มาจาก LINE Webhook (หา Group ID / Follow / Join)
        if (data.events && data.events.length > 0) {
            const event = data.events[0];
            const source = event.source;
            const targetId = source.groupId || source.roomId || source.userId;
            const replyUrl = "https://api.line.me/v2/bot/message/reply";

            // 🔤 พิมพ์ "id" เพื่อดูรหัสกลุ่ม
            if (event.type === 'message' && event.message.text && event.message.text.toLowerCase() === 'id') {
                UrlFetchApp.fetch(replyUrl, {
                    "method": "post",
                    "headers": { "Authorization": "Bearer " + LINE_ACCESS_TOKEN, "Content-Type": "application/json" },
                    "payload": JSON.stringify({
                        "replyToken": event.replyToken,
                        "messages": [{ "type": "text", "text": "🆔 รหัสกลุ่ม/แชทนี้คือ:\n" + targetId }]
                    })
                });
            }

            // 👤 มีคนแอดบอทเป็นเพื่อน
            if (event.type === 'follow') {
                const userId = source.userId;

                // ส่งข้อความต้อนรับหาคนที่แอด
                UrlFetchApp.fetch(replyUrl, {
                    "method": "post",
                    "headers": { "Authorization": "Bearer " + LINE_ACCESS_TOKEN, "Content-Type": "application/json" },
                    "payload": JSON.stringify({
                        "replyToken": event.replyToken,
                        "messages": [{
                            "type": "text",
                            "text": "👋 สวัสดีครับ! ยินดีต้อนรับสู่ Tukkala Cafe 🍵\nสั่งอาหารได้ที่เว็บไซต์ของเราได้เลยนะครับ 😊"
                        }]
                    })
                });

                // แจ้งแอดมินว่ามีคนใหม่แอดบอท
                sendPushToLine("👤 มีผู้ใช้ใหม่แอดบอท!\nUser ID: " + userId);
            }

            // 👥 บอทถูกเพิ่มเข้ากลุ่ม
            if (event.type === 'join') {
                UrlFetchApp.fetch(replyUrl, {
                    "method": "post",
                    "headers": { "Authorization": "Bearer " + LINE_ACCESS_TOKEN, "Content-Type": "application/json" },
                    "payload": JSON.stringify({
                        "replyToken": event.replyToken,
                        "messages": [{
                            "type": "text",
                            "text": "👋 สวัสดีทุกคนครับ! ผม Tukkala Cafe Bot 🍵\nพิมพ์ \"id\" เพื่อดูรหัสกลุ่มนี้ได้เลยนะครับ"
                        }]
                    })
                });

                // แจ้งแอดมินว่าบอทถูกเพิ่มเข้ากลุ่ม
                sendPushToLine("👥 บอทถูกเพิ่มเข้ากลุ่มใหม่!\nGroup ID: " + targetId);
            }
        }

        return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
    } catch (err) {
        sendErrorToLine("Crash: " + err.toString());
        return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
    }
}

function createOrderFlex(order) {
    let imageUrl = "";
    let driveLink = "";
    let debugText = "";

    const hasSlip = !!order.slip_base64;
    const slipLen = hasSlip ? Math.round(order.slip_base64.length / 1024) : 0;

    if (hasSlip) {
        try {
            const folder = getOrCreateFolder("HiddenOvenSlips");
            const blob = Utilities.newBlob(Utilities.base64Decode(order.slip_base64), order.mime_type || 'image/jpeg', 'Slip_' + (order.order_id || order.id));
            const file = folder.createFile(blob);

            file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
            Utilities.sleep(2000);

            imageUrl = "https://lh3.googleusercontent.com/d/" + file.getId() + "=s1600";
            driveLink = file.getUrl();
            debugText = "Upload OK (" + slipLen + "KB)";
        } catch (e) {
            debugText = "Upload Error: " + e.message;
        }
    } else {
        debugText = "Field 'slip_base64' MISSING";
    }

    const contents = [
        { "type": "text", "text": "📦 มีออเดอร์ใหม่! (ชำระเงินแล้ว)", "weight": "bold", "size": "md", "color": "#D4AF37" },
        { "type": "text", "text": "ID: " + (order.order_id || order.id || "-"), "size": "xs", "color": "#999999" },
        { "type": "text", "text": "ลูกค้า: " + (order.customer_name || order.customerName || "-"), "size": "sm", "weight": "bold", "margin": "lg" },
        { "type": "text", "text": "📞 " + (order.customer_phone || order.phone || "-"), "size": "sm" },
        (order.fulfillment_type === 'delivery' || order.type === 'delivery') ? { "type": "text", "text": "📍 ที่อยู่: " + (order.customer_address || order.address || "-"), "wrap": true, "size": "sm", "color": "#FF4500", "margin": "sm" } : { "type": "text", "text": "🏠 รับที่ร้าน", "size": "xs", "color": "#888888" },
        { "type": "separator", "margin": "lg" },
        { "type": "text", "text": "🧾 รายการ: " + (order.order_items || "-"), "wrap": true, "size": "sm", "margin": "md" },
        { "type": "text", "text": "📝 หมายเหตุ: " + (order.customer_note || order.note || "-"), "wrap": true, "size": "sm", "color": "#666666", "margin": "md" },
        { "type": "separator", "margin": "md" },
        {
            "type": "box", "layout": "horizontal", "contents": [
                { "type": "text", "text": "ยอดรวม", "weight": "bold", "size": "sm" },
                { "type": "text", "text": "฿" + (order.total_price || order.total || "-"), "weight": "bold", "align": "end", "color": "#D4AF37" }
            ], "margin": "md"
        },
        { "type": "text", "text": "🛠️ Status: " + debugText, "size": "xxs", "color": "#aaaaaa", "margin": "lg", "align": "center" }
    ];

    if (driveLink) {
        contents.push({
            "type": "box",
            "layout": "vertical",
            "margin": "sm",
            "action": { "type": "uri", "label": "Link", "uri": driveLink },
            "contents": [
                { "type": "text", "text": "🔗 เปิดดูสลิปต้นฉบับใน Drive", "color": "#2196F3", "size": "xxs", "align": "center" }
            ]
        });
    }

    const flexPayload = {
        "type": "bubble",
        "header": imageUrl ? { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "⬇️ ภาพสลิป (Backup)", "size": "xs", "color": "#aaaaaa", "align": "center" }] } : undefined,
        "hero": imageUrl ? { "type": "image", "url": imageUrl, "size": "full", "aspectRatio": "3:4", "aspectMode": "fit", "action": { "type": "uri", "uri": driveLink || imageUrl } } : undefined,
        "body": { "type": "box", "layout": "vertical", "contents": contents },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "button", "style": "primary", "color": "#2C1810", "action": { "type": "uri", "label": "เปิดหน้า Admin", "uri": ADMIN_ORDER_URL + (order.order_id || order.id) } }
            ]
        }
    };

    return { flexPayload, imageUrl };
}

function pushMessages(to, messages) {
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
        "method": "post",
        "headers": { "Authorization": "Bearer " + LINE_ACCESS_TOKEN, "Content-Type": "application/json" },
        "payload": JSON.stringify({ "to": to, "messages": messages })
    });
}

function sendToLine(flexPayload, imageUrl) {
    // ใช้รูปสลิปใน Flex hero เท่านั้น ไม่ส่งแยกเป็น image message อีกรอบ
    const messages = [{
        "type": "flex",
        "altText": "ออเดอร์ใหม่จาก Tukkala Cafe",
        "contents": flexPayload
    }];

    // ส่งหาแอดมิน (User)
    pushMessages(ADMIN_USER_ID, messages);

    // ส่งหากลุ่ม (ถ้าตั้งค่า ADMIN_GROUP_ID ไว้)
    if (ADMIN_GROUP_ID) {
        pushMessages(ADMIN_GROUP_ID, messages);
    }
}

function sendPushToLine(text) {
    try {
        const msgs = [{ "type": "text", "text": text }];
        pushMessages(ADMIN_USER_ID, msgs);
        if (ADMIN_GROUP_ID) pushMessages(ADMIN_GROUP_ID, msgs);
    } catch (e) { }
}

function sendErrorToLine(errorMsg) {
    try {
        const msgs = [{ "type": "text", "text": "⚠️ System Alert: " + errorMsg }];
        pushMessages(ADMIN_USER_ID, msgs);
        if (ADMIN_GROUP_ID) pushMessages(ADMIN_GROUP_ID, msgs);
    } catch (e) { }
}

function getOrCreateFolder(folderName) {
    const folders = DriveApp.getFoldersByName(folderName);
    return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}