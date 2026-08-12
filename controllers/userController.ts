import type { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import CryptoJS, { AES } from "crypto-js";
import { ResultSetHeader } from "mysql2";
import crypto from 'crypto'
import db from "../config/db";
import { sentmail } from "../transport/sentmail";
import dotenv from 'dotenv';
import razorpay from "../utils/Razor";
type cartProps = {

    product_id
    :
    number,
    product_img
    :
    string,
    product_name
    :
    string,
    product_price
    :
    number,
    storename
    :
    string,
    user_id
    :
    number,
    quantity:
    number
}
const insert = "INSERT INTO USERS (username,email,number,password) VALUES(?,?,?,?)"
const insertseller = "INSERT INTO sellers (storename,email,number,password) VALUES(?,?,?,?)"
const finduser = 'SELECT * FROM users WHERE email = (?)'
const findseller = 'SELECT * FROM sellers WHERE email = (?)'
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

export const getuser = (req: Request, res: Response) => {
    res.status(200).json({
        user: users[0],
    })
}
export const postuser = (req: Request, res: Response) => {
    const username = req.body.username;
    const pwd = req.body.pwd;
}
export const signup = async (req: Request, res: Response) => {
    const { username, email, number, password } = req.body
    const encUsername = CryptoJS.AES.encrypt(username, AESSECRET).toString()
    const encEmail = CryptoJS.AES.encrypt(email, AESSECRET).toString()
    const encNumber = CryptoJS.AES.encrypt(number, AESSECRET).toString()
    const encPassword = CryptoJS.AES.encrypt(password, AESSECRET).toString()
    db.query(insert, [encUsername, email, encNumber, encPassword])
    res.status(201).json({
        message: "user created",
        success: true
    })
}
export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        db.query(finduser, [email], (err, rows) => {
            if (err) {
                console.log(err);

            }
            const user = rows as any[]
            if (user.length == 0) {
                return res.status(401).json({
                    message: "user not found"
                });
            }
            const decPassword = decrypt(user[0]?.password);
            if (password !== decPassword) {
                return res.status(400).json({
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
export const fetchuser = async (req: Request, res: Response) => {
    try {
        const authhead = req.headers.authorization;
        if (!authhead || Array.isArray(authhead)) {
            return res.status(401).json({
                message: "Authorization header missing"
            });
        }
        const token = authhead.split(" ")[1]
        console.log("Auth Header:", authhead);
        console.log("Token:", token);
        const user = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
        const email = user.email
        db.query(finduser, [email], (err, rows) => {
            if (err) {
                return err
            }
            const user = rows as any
            console.log("AES_SECRET =", AESSECRET);
            console.log("Encrypted =", user[0].username);

            const username = decrypt(user[0].username);

            console.log("Decrypted =", username);
            res.status(200).json({
                success: true,
                hl: 'fetched user',
                user: user,
                username: username,
                email: email,
                role: user.role

            })

        })


    } catch (err) {
        console.log(err);

    }
}

export const encrypt = (data: string): string => {
    return CryptoJS.AES.encrypt(data, AESSECRET).toString()
}
export const decrypt = (cipher: string): string => {
    const bytes = CryptoJS.AES.decrypt(cipher, AESSECRET)
    return bytes.toString(CryptoJS.enc.Utf8);
}
export const forgetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        const { email } = req.body;
        const expire = new Date(Date.now() + 10 * 60 * 1000)

        db.query(finduser, [email], async (err, rows) => {
            if (err) {
                console.log(err);
            }
            const user = rows as any[]
            if (user.length == 0) {

                return res.status(404).json({
                    success: false,
                    message: "user doesn't exist"
                })


            }
            db.query(deleteOldOtp, [email], (err) => {
                if (err) {
                    console.log(err);
                }

                db.query(storeotp, [email, otp, expire, false]);
            })
            await sentmail(email, 'Reset Password', `
                <h2>Cartify Password Reset</h2>
                <p>Your OTP is</p>
                <h1>${otp}</h1>
                <p>Valid for 10 minutes.</p>
                `)
            res.json({
                otp: otp,
                message: "user exist"
            })

        })

    } catch (err) {
        console.log(err);

    }


}
export const forgetPasswordSeller = async (req: Request, res: Response): Promise<void> => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        const { email } = req.body;
        const expire = new Date(Date.now() + 10 * 60 * 1000)

        db.query(findseller, [email], async (err, rows) => {
            if (err) {
                console.log(err);
            }
            const user = rows as any[]
            if (user.length == 0) {

                return res.status(404).json({
                    success: false,
                    message: "user doesn't exist"
                })


            }
            db.query(storeotp, [email, otp, expire, false])
            await sentmail(email, 'Reset Password', `
                <h2>Cartify Password Reset</h2>
                <p>Your OTP is</p>
                <h1>${otp}</h1>
                <p>Valid for 10 minutes.</p>
                `)
            res.json({
                otp: otp,
                message: "user exist"
            })

        })

    } catch (err) {
        console.log(err);

    }
}
export const verifyotp = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("verify route hit");
        const { email, OTP } = req.body
        db.query(findotp, [email], (err, rows) => {
            const otptable = rows as any[]
            console.log("Entered OTP:", OTP);
            console.log("DB OTP:", otptable[0]?.otp);
            if (otptable.length == 0) {
                return res.status(404).json({
                    message: 'user doesnt exist'
                })
            }
            else if (otptable[0]?.otp !== OTP) {
                return res.status(404).json({
                    message: 'wrong otp'
                })
            }
            res.json({
                message: 'otp verified successfully',
                success: true
            })
        })
    } catch (err) {
        console.log(err);

    }
}
export const userUpdatePwd = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const encpassword = encrypt(password)
        db.query(updateUserPassword, [encpassword, email], (err) => {
            if (err) {
                return res.json({
                    message: err
                })
            }
            db.query(deleteOtp, [email]);
            res.json({
                success: true,
                message: "password changed"
            })
        })
    } catch (err) {
        console.log(err);

    }
}
export const sellerUpdatePwd = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const encpassword = encrypt(password)
        db.query(updateSellerPassword, [encpassword, email], (err) => {
            if (err) {
                return res.json({
                    message: err
                })
            }
            db.query(deleteOtp, [email]);
            res.json({
                success: true,
                message: "password changed"
            })
        })
    } catch (err) {
        console.log(err);

    }
}
export const fetchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        let fetchproducts = `SELECT p.*,s.storename FROM products p left join sellers s on p.seller_id = s.id WHERE status = 'approved' `
        const { search, category, range, filterdate, sortby } = req.query
        let values = []
        if (search) {
            fetchproducts += `AND product_name LIKE concat('%',?,'%')`
            values.push(search)
        }
        if (category) {
            fetchproducts += `AND category = (?)`
            values.push(category)
        }
        if (filterdate === 'today') {
            fetchproducts += `AND DATE(created_at) = CURDATE()`
        }
        if (filterdate === 'week') {
            fetchproducts += `AND YEARWEEK(created_at) = YEARWEEK(CURDATE())`
        }
        if (filterdate === 'month') {
            fetchproducts += `AND MONTH(created_at) = MONTH(CURDATE())`
            fetchproducts += " AND YEAR(created_at) = YEAR(CURDATE())"
        }
        if (filterdate === 'year') {
            fetchproducts += 'AND YEAR(created_at) = YEAR(CURDATE())'
        }
        if (range) {
            fetchproducts += `AND product_price <= ${range}`
        }
        if (sortby === 'newest') {
            fetchproducts += ' ORDER BY created_at DESC'
        }
        if (sortby === 'priceup') {
            fetchproducts += ' ORDER BY product_price ASC'
        }
        if (sortby === 'pricedown') {
            fetchproducts += ' ORDER BY product_price DESC'
        }
        db.query(fetchproducts, values, (err, rows) => {
            if (err) {
                return console.log(err);
            }
            const products = rows as any[];
            const productArray = products.map((item) => ({
                ...item, storename: decrypt(item.storename)
            }))
            res.status(200).json({
                message: "products fetched",
                products: productArray
            })
        })
    } catch (err) {
        console.log(err);

    }
}
interface TokenPayload {
    id: number;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export const addtoCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productID } = req.body;
        const token = req.headers.authorization as string
        const decoded = token.split(" ")[1];
        const user = jwt.verify(decoded, process.env.JWT_SECRET!) as TokenPayload
        const id = user.id
        const fetchcart = 'insert into cart(product_id,user_id) values(?,?)'
        db.query(fetchcart, [productID, id], (err) => {
            console.log(err);
        })
        const fetchcart2 = 'select * from cart'
        db.query(fetchcart2, (err, rows) => {
            if (err) {
                console.log(err);
            }
            const data = rows as any[]
            res.json({
                message: 'cart fetched',
                datas: data
            })
        })
        console.log(user, productID);

    } catch (err) {
        console.log(err);

    }
}
export const fetchCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization;
        const decoded = token?.split(" ")[1] as string
        const user = jwt.verify(decoded, process.env.JWT_SECRET!) as TokenPayload
        const id = user.id
        const fetchcart = 'select c.user_id,c.quantity,c.product_id,p.product_name,p.product_price,p.product_img,s.storename from cart c join products p on p.product_id = c.product_id join sellers s on s.id = p.seller_id where c.user_id = (?)'
        db.query(fetchcart, [id], (err, rows) => {
            const products = rows as any[];
            const fixedproducts = products.map((item) => ({
                ...item, product_price: parseFloat(item.product_price)
            }))
            res.status(200).json({
                message: "cart fetched",
                products: fixedproducts
            })
        })
    } catch (err) {

    }
}
export const deletefromcart = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id
        console.log('id', id);
        const query = 'DELETE FROM cart WHERE product_id = (?)'
        db.query(query, [id], (err) => {
            if (err) {
                console.log(err);
            }
            res.status(200).json({
                message: "deleted successfully"
            })


        })


    } catch (err) {
        console.log(err);

    }
}
export const updateQuantity = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { type, userid } = req.body;
    console.log(id, type, userid);
    let updatequantity = ''
    const value: any[] = []

    if (type === 'inc') {
        updatequantity = `UPDATE  cart SET quantity = quantity + 1 WHERE product_id = ${id} and user_id = ${userid} `
        db.query(updatequantity, (err) => {
            console.log(err);

        })
    }
    else if (type === 'dec') {
        updatequantity = ` UPDATE cart SET quantity = quantity - 1 WHERE quantity > 1 AND product_id = ${id} and user_id = ${userid} `
        db.query(updatequantity, (err) => {
            console.log(err);
        })
    }
    else {
        return console.log('wrong type');
    }
    res.status(200).json({
        message: "quantity updated"
    })
}
export const checkoutOnline = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount }: { amount: number } = req.body
        if (!amount || isNaN(amount)) {
            res.status(400).json({ error: "Invalid amount" });
            return;
        }
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now()
        }
        const order = await razorpay.orders.create(options)
        res.status(200).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        })
    } catch (err) {
        console.log(err);

    }
}
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.log('missing creds');
            return;
        }
        const body = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET!).update(body).digest('hex')
        if (expectedSignature === razorpay_signature) {
            const { token } = req.body
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
            const userid = decoded.id
            const { totalamount } = req.body
            const query = 'INSERT INTO orders (user_id, total_amount, payment_id, order_id, status) VALUES(?,?,?,?,?)'
            db.query(query, [userid, totalamount, razorpay_payment_id, razorpay_order_id, 'paid'], (err, rows: ResultSetHeader) => {
                if (err) {
                    return console.log('error accured while insert into db');
                }
                const OrderdbId = rows.insertId
                const delquery = 'DELETE FROM cart WHERE user_id = (?)'
                db.query(delquery, [userid], (err, rows: ResultSetHeader) => {
                    if (err) {
                        console.log(err);
                    }

                    const itemquery = 'INSERT INTO order_items (order_id,product_id,quantity,price) VALUES ?'
                    const { cart } = req.body
                    const values = cart.map((item: cartProps) => [
                        OrderdbId,
                        item.product_id,
                        item.quantity,
                        item.product_price

                    ]
                    )

                    db.query(itemquery, [values], (err) => {
                        if (err) {
                            console.log(err);

                        }
                    })
                })
            })


            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid signature",
            });
        }
    } catch (err) {
        console.log(err);

    }
}
export const fetchOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body
        if (!token) {
            return console.log('token not found');
        }
        const decode = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
        const userId = decode.id
        const query = `select o.user_id,DATE_FORMAT(o.created_at, '%Y-%m-%d') AS order_date,i.id,i.product_id,i.price,i.quantity,i.delivery_status,p.product_img,p.product_name,s.storename   from orders o join order_items i on o.id = i.order_id join products p on i.product_id = p.product_id  join sellers s on p.seller_id = s.id where user_id = (?)`;
        db.query(query, [userId], (err, rows) => {
            if (err) {
                return console.log(err);
            }
            const orders = rows as any[]
            const orderfull = orders.map((item) => ({

                ...item,
                storename: decrypt(item.storename),
                price: parseFloat(item.price),
                created_at: String(item.created_at).slice(0, 10),
                OrderID: '#ORD-' + item.id + item.product_id
            }))

            res.status(200).json({
                message: "orders details fetched",
                orders: orderfull
            })
        })
    } catch (err) {
        console.log(err);

    }
}
export const fetchOrderDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params
        const query = `select o.user_id,DATE_FORMAT(o.created_at, '%Y-%m-%d') AS order_date,i.id,i.product_id,i.price,i.quantity,i.delivery_status,p.product_img,p.product_name,s.storename   from orders o join order_items i on o.id = i.order_id join products p on i.product_id = p.product_id  join sellers s on p.seller_id = s.id where i.product_id = (?)`
        db.query(query, [id], (err, rows) => {
            if (err) {
                return console.log(err);
            }
            const orders = rows as any[]
            const orderfull = orders.map((item) => ({

                ...item,
                storename: decrypt(item.storename),
                price: parseFloat(item.price),
                created_at: String(item.created_at).slice(0, 10),
                OrderID: '#ORD-' + item.id + item.product_id
            }))
            res.status(200).json({
                message:"order details fetched",
                products:orderfull
            })
        })
    } catch (err) {

    }
}
export const fetchTrendingProducts = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const query = `
            SELECT p.*, s.storename
            FROM products p
            LEFT JOIN sellers s
                ON p.seller_id = s.id
            WHERE p.status = 'approved'
            ORDER BY RAND()
            LIMIT 8
        `;

        db.query(query, (err, rows) => {
            if (err) {
                console.log(err);

                res.status(500).json({
                    success: false,
                    message: "Failed to fetch trending products"
                });
                return;
            }

            const products = rows as any[];

            const productArray = products.map((item) => ({
                ...item,
                storename: item.storename
                    ? decrypt(item.storename)
                    : item.storename
            }));

            res.status(200).json({
                success: true,
                message: "Trending products fetched",
                products: productArray
            });
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


