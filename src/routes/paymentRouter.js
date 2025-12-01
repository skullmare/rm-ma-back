import express from "express";
import YooKassa from "yookassa";

const router = express.Router();

// Инициализация ЮKassa SDK
const yookassa = new YooKassa({
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// -----------------------------------------------------------
// 1. Создание первого платежа с сохранением карты
// -----------------------------------------------------------
router.post("/create-payment", async (req, res) => {
    try {
        const { chat_id } = req.body;

        const payment = await yookassa.createPayment({
            amount: {
                value: "1000",
                currency: "RUB",
            },
            confirmation: {
                type: "redirect",
                return_url: "https://t.me/miniapp_rocketmind_bot/miniapp",
            },
            capture: true,
            description: "Оплата подписки Rocketmind",
            save_payment_method: true, // <--- обязательно для автосписания!
            payment_method_data: {
                type: "bank_card"
            },
            metadata: { chat_id },
        });

        return res.json(payment);
    } catch (error) {
        console.error("Ошибка создания платежа:", error);
        return res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------
// 2. Ежемесячное списание (вызывается из n8n)
// -----------------------------------------------------------
router.post("/charge", async (req, res) => {
    try {
        const { chat_id, payment_method_id } = req.body;

        if (!chat_id || !payment_method_id) {
            return res.status(400).json({
                error: "chat_id и payment_method_id обязательны"
            });
        }

        const payment = await yookassa.createPayment({
            amount: {
                value: "1000",
                currency: "RUB",
            },
            payment_method_id: payment_method_id, // <--- автосписание
            capture: true,
            description: "Месячное списание — продление подписки",
            metadata: { chat_id },
        });

        return res.json(payment);
    } catch (error) {
        console.error("Ошибка автосписания:", error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
