import app from "./app";
import { Request, Response } from "express";
import cors from 'cors'
import express from 'express'
import router from "./routes/UserRoutes";
import db from "./config/db";
import userRouter from "./routes/UserRoutes";
import sellerRouter from "./routes/SellerRoutes";
import adminRouter from './routes/AdminRoute'
import { encrypt, decrypt } from "./controllers/userController";
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

app.options("*", cors());
app.use(express.json())
app.use("/uploads", express.static("uploads"));
db.query("SELECT * FROM users", (err, result) => {
    if (err) {
        console.log(err);
    }
    console.log(result);

})
const enc = encrypt("suresh")
console.log("encrypted", enc);
const dec = decrypt(enc)
console.log("decrypted", dec);


app.get('/', (req: Request, res: Response) => {
    res.send("server working")
})
app.use("/", userRouter)
app.use('/', sellerRouter)
app.use('/', adminRouter)
app.listen(3000, () => {
    console.log('server is started');
})