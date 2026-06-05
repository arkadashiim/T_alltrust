import { Router, Request, Response } from "express";
import { verifyWebhookSignature } from "../middleware/verifySignature";
import { paymentService } from "../services/payment";

const router = Router();

/**
 * @openapi
 * /webhook:
 *   post:
 *     tags:
 *       - Webhook
 *     summary: Обработать вебхук оплаты
 *     parameters:
 *       - name: X-Signature
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC-SHA256 подпись
 *       - name: X-Timestamp
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Unix timestamp в миллисекундах
 *       - name: X-Nonce
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Уникальный идентификатор запроса
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - status
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [paid, failed]
 *     responses:
 *       "200":
 *         description: Вебхук обработан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 updated:
 *                   type: boolean
 *                 invoice:
 *                   type: object
 *                   properties:
 *                     invoiceId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, paid, failed]
 *       "401":
 *         description: Невалидная подпись или заголовки
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  "/",
  verifyWebhookSignature,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const nonce = req.headers["x-nonce"] as string;
      const result = await paymentService.processWebhook(req.body, nonce);

      res.status(200).json({
        ok: true,
        updated: result.updated,
        invoice: result.invoice,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
