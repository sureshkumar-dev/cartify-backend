import { Router } from "express";
import { adminLogin, fetchOrdersAdmin, fetchProductRequests, FetchSellers, fetchUsers, manageProducts } from "../controllers/adminController";
const router = Router();
router.post('/admin/login',adminLogin);
router.post('/admin/manage-requests',manageProducts)
router.get('/admin/product-requests',fetchProductRequests)
router.get('/admin/fetch-users',fetchUsers)
router.get('/admin/fetch-sellers',FetchSellers)
router.get('/admin/fetchorders',fetchOrdersAdmin)
export default router;