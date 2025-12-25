import express from "express";
import YooKassa from "yookassa";
import { authGuard } from "../middleware/authGuard.js";
import { unsubscribeFromPremium } from "../services/n8nClient.js";

const router = express.Router();

const AMOUNT = "11.00";

// -----------------------------------------------------------
// Инициализация YooKassa SDK
// -----------------------------------------------------------
const yookassa = new YooKassa({
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// -----------------------------------------------------------
// Утилита для определения chat_id
// -----------------------------------------------------------
const resolveChatId = (req) =>
    req.chatId ||
    req.user?.chatId ||
    req.user?.telegramId ||
    req.user?.id ||
    req.auth?.telegramUser?.id;

// -----------------------------------------------------------
// Общий receipt (54-ФЗ)
// -----------------------------------------------------------
const buildReceipt = (description) => ({
    customer: {
        email: "ai@rocketmind.ru", // обязательный email для ЮKassa
    },
    items: [
        {
            description,
            quantity: "1.00",
            amount: {
                value: AMOUNT,
                currency: "RUB",
            },
            vat_code: 1, // НДС не облагается (SaaS / услуги)
            payment_mode: "full_payment",
            payment_subject: "service",
        },
    ],
    tax_system_code: 1,
});

// -----------------------------------------------------------
// 1. Первый платёж (сохранение карты)
// -----------------------------------------------------------
router.post("/create-payment", authGuard, async (req, res) => {
    try {
        const chatId = resolveChatId(req);

        if (!chatId) {
            return res.status(400).json({ error: "User chat_id not found" });
        }

        const payment = await yookassa.createPayment({
            amount: {
                value: AMOUNT,
                currency: "RUB",
            },
            confirmation: {
                type: "redirect",
                return_url: process.env.YOOKASSA_RETURN_URL,
            },
            capture: true,
            description: "Оплата подписки Rocketmind",
            save_payment_method: true, // обязательно для автосписаний
            payment_method_data: {
                type: "bank_card",
            },
            receipt: buildReceipt("Подписка Rocketmind на 1 месяц"),
            metadata: {
                chat_id: String(chatId),
            },
        });

        return res.json(payment);
    } catch (error) {
        console.error("Ошибка создания платежа:", error);
        return res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------
// 2. Автосписание (вызывается из n8n)
// -----------------------------------------------------------
const AUTH_KEY = process.env.CHARGE_AUTH_KEY;

router.post("/uYeeKVVtVHF8bibriRywhvyKko4yl1LirJ7nXivys8R", async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader || authHeader !== `Bearer ${AUTH_KEY}`) {
            return res.status(403).json({ error: "Нет доступа" });
        }

        const { chat_id, payment_method_id } = req.body;

        if (!chat_id || !payment_method_id) {
            return res.status(400).json({
                error: "chat_id и payment_method_id обязательны",
            });
        }

        const payment = await yookassa.createPayment({
            amount: {
                value: AMOUNT,
                currency: "RUB",
            },
            payment_method_id, // автосписание
            capture: true,
            description: "Продление подписки Rocketmind",
            receipt: buildReceipt("Продление подписки Rocketmind на 1 месяц"),
            metadata: {
                chat_id,
            },
        });

        return res.json(payment);
    } catch (error) {
        console.error("Ошибка автосписания:", error);
        return res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------
// 3. Отмена подписки
// -----------------------------------------------------------
router.post("/unsubscribe", authGuard, async (req, res) => {
    try {
        const chatId = resolveChatId(req);

        if (!chatId) {
            return res.status(400).json({ error: "User chat_id not found" });
        }

        const result = await unsubscribeFromPremium(chatId);

        if (result?.status === "error") {
            return res.status(500).json({
                error: result.error || "Failed to cancel subscription",
            });
        }

        return res.json({ success: true, data: result });
    } catch (error) {
        console.error("Ошибка отмены подписки:", error);
        return res.status(500).json({ error: "Failed to unsubscribe" });
    }
});

export default router;
