import express from "express";
import { responder } from "./agente.js";

const app = express();
const puerto = Number(process.env.PORT || 3000);

if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
  throw new Error("PORT debe ser un número entre 1 y 65535.");
}

app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({ estado: "ok" });
});

app.post("/api/mensaje", async (req, res, next) => {
  const { userId, texto } = req.body ?? {};
  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    userId.length > 128 ||
    typeof texto !== "string" ||
    !texto.trim() ||
    texto.length > 4000
  ) {
    return res.status(400).json({
      error: "Envía userId y texto como cadenas no vacías; texto admite hasta 4000 caracteres.",
    });
  }

  try {
    const respuesta = await responder(userId.trim(), texto.trim());
    return res.json({ respuesta });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error("Error atendiendo la solicitud:", error);
  if (res.headersSent) return;
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  return res.status(status).json({
    error: status === 500 ? "Ocurrió un error interno. Inténtalo de nuevo más tarde." : error.message,
  });
});

app.listen(puerto, "127.0.0.1", () => {
  console.log(`API lista en http://127.0.0.1:${puerto}`);
});
