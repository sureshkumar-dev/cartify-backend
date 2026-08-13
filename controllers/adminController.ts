import type { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import CryptoJS, { AES } from "crypto-js";
import db from "../config/db";
import { sentmail } from "../transport/sentmail";
import { encrypt, decrypt } from "./userController";
import dotenv from 'dotenv';
const fetchProductReq = 'select p.*,s.storename from  products p inner join sellers s on p.seller_id = s.id where p.status = (?)'
const fetchusers = 'SELECT username,email,id FROM users where email is NOT NULL and username is NOT NULL'
const fetchsellers = 'SELECT s.*,count(p.seller_id) as total_products  FROM sellers s left join products p on s.id = p.seller_id GROUP BY s.id '
const countproducts = 'SELECT count(*) FROM products WHERE seller_id = (?)'
const manageproducts = 'UPDATE  products SET status = (?) WHERE product_id=(?)'
export const adminLogin = async(req:Request,res:Response) => {
    const{ adminid , adminpwd } = req.body
    const ADMINID = process.env.ADMIN_ID;
    const ADMINPWD = process.env.ADMIN_PASSWORD;
    if(adminid == ADMINID && adminpwd == ADMINPWD){
        const token = jwt.sign({id:adminid,role:"admin"},process.env.JWT_SECRET!,{expiresIn:'7d'})
        return res.status(200).json({
            message:"admin access ",
            token:token
        })

    }
    res.status(404).json({
        message:"something went wrong admin access denied"
    })

}
export const fetchProductRequests = async(req:Request,res:Response) => {
    db.query(fetchProductReq,['pending'],(err,rows)=>{
        if(err){
            return console.log(err);
        }
        const products = rows as any[]
        const Product = products.map((item)=>({
            ...item,storename:decrypt(item.storename)
        }))
        res.status(200).json({
            message:"product fetched",
            products:Product
        })

    })
}
export const fetchUsers = async(req:Request,res:Response) => {
    db.query(fetchusers,(err,rows)=>{
        if(err){
            return console.log(err);
        }
        const users = rows as any[]
        const decusers = users.map((item) => ({
            ...item,username:decrypt(item.username)
        }))
        res.status(200).json({
            message:"users fetched",
            users:decusers
        })
    })
}
export const FetchSellers = async(req:Request,res:Response) => {
    db.query(fetchsellers,(err,rows)=>{
        if(err){
            return console.log(err);
        }
        const sellers = rows as any[]
        const sellersDetails = sellers.map((item)=>({
            ...item,
            storename:decrypt(item.storename)
        }))
        
        res.status(200).json({
            message:"sellers fetched",
            sellers:sellersDetails
        })
    })
}
export const manageProducts = async(req:Request,res:Response) => {
    const {id,status} = req.body;
    db.query(manageproducts,[status,id],(err)=>{
        if(err){
            console.log(err);
        }
    })

}
export const  fetchOrdersAdmin = async(req:Request,res:Response) => {
    try{
        const query = 'SELECT * FROM oredrs'
        db.query(query,(err,rows)=>{
            if(err){
              return console.log(err);
            }
            let orders = rows as any[]
            res.status(200).json({
                orders:orders
            })

        })
    }catch(err){
        console.log(err);
        
    }
}