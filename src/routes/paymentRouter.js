import express from "express";
import YooKassa from "yookassa";
import crypto from "crypto";

const router = express.Router();

// Инициализация ЮKassa SDK
const yookassa = new YooKassa({
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// -----------------------------------------------------------
// 1. Создание платежа
// -----------------------------------------------------------
router.post("/create-payment", async (req, res) => {
    try {
        const { amount, description } = req.body;

        const payment = await yookassa.createPayment({
            amount: {
                value: amount,
                currency: "RUB",
            },
            confirmation: {
                type: "redirect",
                return_url: "https://t.me/miniapp_rocketmind_bot/miniapp",
            },
            capture: true,
            description,
        });

        return res.json(payment);
    } catch (error) {
        console.error("Ошибка создания платежа:", error);
        return res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------
// 2. Webhook от ЮKassa (callback)
// -----------------------------------------------------------
router.post(
    "/webhook",
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        },
    }),
    (req, res) => {
        try {
            const signature = req.headers["content-hmac-sha256"];
            const secret = process.env.YOOKASSA_WEBHOOK_SECRET;

            const hmac = crypto.createHmac("sha256", secret)
                .update(req.rawBody)
                .digest("hex");

            if (signature !== hmac) {
                return res.status(401).send("Invalid signature");
            }

            console.log("Webhook:", req.body);

            res.status(200).send("OK");
        } catch (error) {
            console.error(error);
            res.status(500).send("server error");
        }
    }
);

// Экспорт
export default router;