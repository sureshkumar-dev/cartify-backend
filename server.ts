import app from "./app";
import  { Request , Response } from "express";
import cors from 'cors'
import express from 'express'
import router from "./routes/UserRoutes";
import db from "./config/db";
import userRouter from "./routes/UserRoutes";
import sellerRouter from "./routes/SellerRoutes";
import adminRouter from './routes/AdminRoute'
import { encrypt , decrypt } from "./controllers/userController";
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://cartify-ecommerce-marketplace.vercel.app"
    ],
    credentials: true
}));
app.use(express.json())
app.use("/uploads", express.static("uploads"));
db.query("SELECT * FROM users", (err, result) => {
    if (err) {
        console.log(err);
    }
    console.log(result);

})
const enc = encrypt("suresh")
console.log("encrypted",enc);
const dec = decrypt(enc)
console.log("decrypted",dec);


app.get('/', (req:Request, res:Response) => {
    res.send("server working")
})
app.use("/", userRouter)
app.use('/',sellerRouter)
app.use('/',adminRouter)
app.listen(3000, () => {
    console.log('server is started');
})