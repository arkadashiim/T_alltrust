import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./swagger";
import invoiceRouter from "./routes/invoice";
import webhookRouter from "./routes/webhook";

const app = express();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/invoice", invoiceRouter);
app.use("/webhook", webhookRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
