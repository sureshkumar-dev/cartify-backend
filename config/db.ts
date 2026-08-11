import mysql from 'mysql2';
import dotenv from 'dotenv'
import { error } from 'node:console';
dotenv.config()
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DATABASE
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
