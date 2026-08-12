import mysql from 'mysql2';
import dotenv from 'dotenv'
import fs from 'fs'
import { error } from 'node:console';
dotenv.config()
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DATABASE,
    ssl: {
        ca: fs.readFileSync('./certs/ca.pem'),
        rejectUnauthorized: true
    }
})
db.connect((err) => {
    if (err) {
        console.log(err);
        return
    }
    console.log("db connected");
}
)
export default db
