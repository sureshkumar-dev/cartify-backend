import app from "./app";
import { Request, Response } from "express";
import cors from "cors";
import express from "express";
import db from "./config/db";
import userRouter from "./routes/UserRoutes";
import sellerRouter from "./routes/SellerRoutes";
import adminRouter from "./routes/AdminRoute";

const allowedOrigins = [
  "http://localhost:5173",
  "https://cartify-ecommerce-marketplace.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.get("/", (req: Request, res: Response) => {
  res.send("server working");
});

app.use("/", userRouter);
app.use("/", sellerRouter);
app.use("/", adminRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});