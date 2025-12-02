import { Router } from "express";
import jwtAuth from "../Middlewares/Auth/JwtAuth.js";
import multer from "multer";
import AuthController from "../Controllers/Auth/AuthController.js";
import VoucherController from "../Controllers/Voucher/VoucherController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });
router.post("/login", AuthController.login.bind(AuthController));

// Voucher routes
router.get("/vouchers", jwtAuth(), VoucherController.getVouchers);
router.get("/vouchers/:id", jwtAuth(), VoucherController.getVoucherById);
router.post("/vouchers", jwtAuth(), VoucherController.createVoucher);
router.put("/vouchers/:id", jwtAuth(), VoucherController.updateVoucher);
router.delete("/vouchers/:id", jwtAuth(), VoucherController.deleteVoucher);
router.post("/vouchers/:id/print", jwtAuth(), VoucherController.printVoucher);
router.post(
  "/vouchers/import",
  jwtAuth(),
  upload.single("file"),
  VoucherController.importVouchers
);

export default router;
