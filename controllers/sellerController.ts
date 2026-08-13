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
export const sellerSignup = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            storename,
            email,
            number,
            password
        } = req.body;

        if (!storename || !email || !number || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required"
            });
            return;
        }

        const encStorename = encrypt(storename);
        const encNumber = encrypt(number);
        const encPassword = encrypt(password);

        db.query(
            insertseller,
            [
                encStorename,
                email,
                encNumber,
                encPassword
            ],
            (err) => {
                if (err) {
                    console.log("Seller signup DB error:", err);

                    res.status(500).json({
                        success: false,
                        message: "Seller creation failed"
                    });
                    return;
                }

                res.status(201).json({
                    success: true,
                    message: "Seller created successfully"
                });
            }
        );

    } catch (err) {
        console.log("Seller signup error:", err);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
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
export const AddProduct = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            ProductName,
            ProductDesc,
            ProductPrice,
            ProductCategory
        } = req.body;

        const ProductImage = req.file?.filename;

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Token not found"
            });
            return;
        }

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as TokenPayload;

        if (!user?.id) {
            res.status(401).json({
                success: false,
                message: "Invalid user"
            });
            return;
        }

        if (
            !ProductName ||
            !ProductDesc ||
            !ProductPrice ||
            !ProductCategory
        ) {
            res.status(400).json({
                success: false,
                message: "All product fields are required"
            });
            return;
        }

        const seller_id = user.id;

        db.query(
            addproduct,
            [
                ProductName,
                ProductDesc,
                ProductPrice,
                ProductCategory,
                ProductImage,
                1,
                seller_id
            ],
            (err) => {
                if (err) {
                    console.log("Add product DB error:", err);

                    res.status(500).json({
                        success: false,
                        message: "Failed to add product"
                    });
                    return;
                }

                res.status(201).json({
                    success: true,
                    message: "Product added successfully"
                });
            }
        );

    } catch (err) {
        console.log("Add product error:", err);

        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
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
export const delProduct = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Token not found"
            });
            return;
        }

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as TokenPayload;

        const query = `
            DELETE FROM products
            WHERE product_id = ?
            AND seller_id = ?
        `;

        db.query(
            query,
            [id, user.id],
            (err, result) => {
                if (err) {
                    console.log("Delete product DB error:", err);

                    res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                    return;
                }

                res.status(200).json({
                    success: true,
                    message: "Product deleted"
                });
            }
        );

    } catch (err) {
        console.log("Delete product error:", err);

        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
export const updateStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { ordersts, o_id, p_id } = req.body;

        if (!ordersts || !o_id || !p_id) {
            res.status(400).json({
                success: false,
                message: "Missing order details"
            });
            return;
        }

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Token not found"
            });
            return;
        }

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as TokenPayload;

        const query = `
            UPDATE orders o
            JOIN order_items oi
                ON o.order_id = oi.order_id
            JOIN products p
                ON oi.product_id = p.product_id
            SET o.delivery_status = ?
            WHERE o.order_id = ?
              AND oi.product_id = ?
              AND p.seller_id = ?
        `;

        db.query(
            query,
            [ordersts, o_id, p_id, user.id],
            (err, result: any) => {
                if (err) {
                    console.log("Update status DB error:", err);

                    res.status(500).json({
                        success: false,
                        message: "Failed to update order status"
                    });
                    return;
                }

                if (result.affectedRows === 0) {
                    res.status(404).json({
                        success: false,
                        message: "Order not found or unauthorized"
                    });
                    return;
                }

                res.status(200).json({
                    success: true,
                    message: "Order status updated successfully"
                });
            }
        );

    } catch (err) {
        console.log("Update status error:", err);

        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
export const FetchSellerOrders = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Token not found",
            });
            return;
        }

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as TokenPayload;

        const query = `
            SELECT
                oi.id,
                o.user_id,
                oi.product_id,

                p.product_name,
                p.product_img,

                oi.price,
                oi.quantity,

                o.order_id AS OrderID,
                o.delivery_status

            FROM orders o

            JOIN order_items oi
                ON o.order_id = oi.order_id

            JOIN products p
                ON oi.product_id = p.product_id

            WHERE p.seller_id = ?

            ORDER BY o.order_id DESC
        `;

        db.query(query, [user.id], (err, rows) => {
            if (err) {
                console.log("🔥 FETCH ORDERS DB ERROR:", err);

                res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err
                });
                return;
            }

            console.log("🔥 SELLER ORDERS:", rows);

            res.status(200).json({
                success: true,
                orders: rows
            });
        });

    } catch (err) {
        console.log(" FETCH ORDERS ERROR:", err);

        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};