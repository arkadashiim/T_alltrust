import { Router, Request, Response } from "express";
import { paymentService } from "../services/payment";

const router = Router();

/**
 * @openapi
 * /invoice:
 *   post:
 *     tags:
 *       - Invoice
 *     summary: Создать инвойс
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - merchantId
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 200
 *               currency:
 *                 type: string
 *                 example: USD
 *               merchantId:
 *                 type: string
 *                 example: merchant-1
 *     responses:
 *       "201":
 *         description: Инвойс создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: string
 *                   format: uuid
 *                 amount:
 *                   type: number
 *                   example: 200
 *                 currency:
 *                   type: string
 *                   example: USD
 *                 fee:
 *                   type: number
 *                   example: 10
 *                 amountToReceive:
 *                   type: number
 *                   example: 190
 *                 status:
 *                   type: string
 *                   enum: [pending, paid, failed]
 *       "400":
 *         description: Невалидные данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       "404":
 *         description: Мерчант не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await paymentService.createInvoice(req.body);
    res.status(201).json({
      invoiceId: invoice.invoiceId,
      amount: invoice.amount,
      currency: invoice.currency,
      fee: invoice.fee,
      amountToReceive: invoice.amountToReceive,
      status: invoice.status,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
});

/**
 * @openapi
 * /invoice/{id}:
 *   get:
 *     tags:
 *       - Invoice
 *     summary: Получить инвойс по ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: invoiceId
 *     responses:
 *       "200":
 *         description: Данные инвойса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: string
 *                   format: uuid
 *                 merchantId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 feePercent:
 *                   type: number
 *                 fee:
 *                   type: number
 *                 amountToReceive:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [pending, paid, failed]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       "404":
 *         description: Инвойс не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const invoice = await paymentService.getInvoice(id);
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json({
      invoiceId: invoice.invoiceId,
      merchantId: invoice.merchantId,
      amount: invoice.amount,
      currency: invoice.currency,
      feePercent: invoice.feePercent,
      fee: invoice.fee,
      amountToReceive: invoice.amountToReceive,
      status: invoice.status,
      createdAt: (invoice as any).createdAt,
      updatedAt: (invoice as any).updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
