import { Router } from "express";
import {
    getuser,
    signup,
    userLogin,
    fetchuser,
    forgetPassword,
    verifyotp,
    userUpdatePwd,
    fetchProducts,
    addtoCart,
    fetchCart,
    deletefromcart,
    updateQuantity,
    checkoutOnline,
    verifyPayment,
    fetchOrders,
    fetchOrderDetails
} from "../controllers/userController";

const router = Router();

router.get("/", getuser);

router.post("/buyer/signup", signup);
router.post("/buyer/login", userLogin);
router.get("/fetch-user", fetchuser);

router.post("/buyer/forget-password", forgetPassword);
router.post("/buyer/forget-password/verify-otp", verifyotp);
router.post("/buyer/update-password", userUpdatePwd);
router.get('/buyer/fetch-product',fetchProducts)
router.post('/buyer/add-to-cart',addtoCart);
router.get('/buyer/fetch-cart',fetchCart);
router.delete('/buyer/delete-cart/:id',deletefromcart)
router.patch('/buyer/update-quantity/:id',updateQuantity)
router.post('/buyer/checkout-razorpay',checkoutOnline)
router.post('/buyer/verify-payment',verifyPayment)
router.post('/buyer/fetchOrders',fetchOrders)
router.post('/buyer/orderdetails/:id',fetchOrderDetails)
export default router;