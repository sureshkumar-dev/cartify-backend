import { Router } from "express";
import upload from "../middlewares/upload";
import {
    sellerSignup,
    sellerLogin,
    fetchSeller,
    
    AddProduct,
    FetchProducts,
    delProduct,
    updateStatus,
    FetchSellerOrders,
    fetchPendingorders
} from "../controllers/sellerController";

import{forgetPasswordSeller,
    verifyotp,
    sellerUpdatePwd} from '../controllers/userController'

const router = Router();

router.post("/seller/signup", sellerSignup);
router.post("/seller/login", sellerLogin);
router.post('/seller/fetch-products',FetchProducts)
router.delete('/seller/product-delete/:id',delProduct)
router.get("/fetch-seller", fetchSeller);

router.post("/seller/forget-password", forgetPasswordSeller);
router.post("/seller/forget-password/verify-otp", verifyotp);
router.post("/seller/update-password", sellerUpdatePwd);
router.post('/seller/change-status',updateStatus)
router.get("/seller/fetch-orders", FetchSellerOrders);
router.get('/seller/pendingOrders',fetchPendingorders)
router.post("/seller/add-product",upload.single('ProductImage'),AddProduct);

export default router;