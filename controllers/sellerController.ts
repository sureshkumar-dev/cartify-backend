import type { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import CryptoJS, { AES } from "crypto-js";
import db from "../config/db";
import { sentmail } from "../transport/sentmail";
import { encrypt, decrypt } from "./userController";
import dotenv from 'dotenv';
const deleteProduct = 'DELETE FROM products WHERE product_id = (?)'
const insert = "INSERT INTO USERS (username,email,number,password) VALUES(?,?,?,?)"
const insertseller = "INSERT INTO sellers (storename,email,number,password) VALUES(?,?,?,?)"
const finduser = 'SELECT * FROM users WHERE email = (?)'
const findseller = 'SELECT * FROM sellers WHERE email = (?)'
const showproducts = 'SELECT * FROM products WHERE seller_id = (?)'
const storeotp = 'INSERT INTO reset_password_otp (email,otp,expire,is_used) VALUES(?,?,?,?)'
const findotp =
    `SELECT * 
 FROM reset_password_otp
 WHERE email = ?
 ORDER BY id DESC
 LIMIT 1`;
const deleteOldOtp =
    "DELETE FROM reset_password_otp WHERE email=?";
const updateUserPassword =
    "UPDATE users SET password=? WHERE email=?";

const updateSellerPassword =
    "UPDATE sellers SET password=? WHERE email=?";

const deleteOtp =
    "DELETE FROM reset_password_otp WHERE email=?";
const users = [{ username: "suresh", age: 19 }]
dotenv.config();
const AESSECRET = process.env.AES_SECRET!;
const addproduct = 'INSERT INTO products (product_name,product_desc,product_price,category,product_img,product_stock,seller_id) VALUES(?,?,?,?,?,?,?) '
export const fetchSeller = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || Array.isArray(authHeader)) {
            res.status(401).json({
                success: false,
                message: "Authorization header missing"
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: number;
            email: string;
            role: string;
        };

        db.query(
            "SELECT id, storename, email, number FROM sellers WHERE id = ?",
            [decoded.id],
            (err, rows) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                const seller = rows as any[];

                if (seller.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Seller not found"
                    });
                }
                const sellername = decrypt(seller[0].storename)
                res.status(200).json({
                    success: true,
                    seller: seller[0],
                    sellername: sellername,
                    role: "seller"
                });
            }
        );

    } catch (err) {
        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
export const sellerSignup = async (req: Request, res: Response) => {
    try {
        const { storename, email, number, password } = req.body;
        const encStorename = encrypt(storename);
        const encEmail = encrypt(email);
        const encNumber = encrypt(number);
        const encPassword = encrypt(password);
        db.query(insertseller, [encStorename, email, encNumber, encPassword])
        res.status(201).json({
            success: true,
            message: "seller created"
        })

    } catch (err) {
        console.log(err);

    }
}
export const sellerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        db.query(findseller, [email], (error, rows) => {
            if (error) {
                console.log(error);
            }
            const user = rows as any[];
            if (user?.length == 0) {
                return res.json({
                    message: "user not found"
                })
            }
            const decPassword = decrypt(user[0]?.password)
            if (password !== decPassword) {
                return res.json({
                    message: "wrong password"
                })
            }
            const token = jwt.sign({
                id: user[0]?.id,
                email: user[0]?.email,
                role: user[0]?.role
            }, process.env.JWT_SECRET!,
                {
                    expiresIn: '7d'
                })
            res.status(200).json({
                user: rows,
                success: true,
                token: token,
            })

        })
    } catch (err) {
        console.log(err);

    }
}
interface TokenPayload {
    email: string;
    id: number;
    role: string;
}
export const AddProduct = async (req: Request, res: Response) => {
    try {
        const ProductName = req.body.ProductName;
        const ProductDesc = req.body.ProductDesc;
        const ProductPrice = req.body.ProductPrice;
        const ProductCategory = req.body.ProductCategory;
        const ProductImage = req.file?.filename;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(404).json({
                message: "token not found"
            })
        }
        const user = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
        console.log("token", user);
        if (!user) {
            return res.json({
                message: "user not found"
            })
        }
        const seller_id = user.id
        db.query(addproduct, [ProductName, ProductDesc, ProductPrice, ProductCategory, ProductImage, 1, seller_id], (err) => {

        })
        const seller = user.id;
        db.query(showproducts, [seller], (err, rows) => {
            const productArray = rows as any[]
            res.status(200).json({
                products: productArray
            })
        })
    } catch (err) {
        console.log(err);

    }




}
export const FetchProducts = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token not found",
            });
        }

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as TokenPayload;

        db.query(showproducts, [user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({
                    message: "Database Error",
                });
            }

            res.status(200).json({
                success: true,
                products: rows,
            });
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
export const delProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    console.log(req.originalUrl);
    console.log(req.params);
    console.log("params:", req.params);
    console.log("id:", req.params.id);
    db.query(deleteProduct, [id], (err) => {
        if (err) {
            return console.log(err);

        }
        res.json({
            message: "product deleted"
        })


    })

}