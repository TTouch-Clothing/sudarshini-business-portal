import { Router } from "express";
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "../controllers/adminController.js";
import { protect, allowRoles } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(protect);
router.use(allowRoles("ADMIN"));

router.get("/", listAdmins);
router.post("/", upload.single("image"), createAdmin);
router.put("/:id", upload.single("image"), updateAdmin);
router.delete("/:id", deleteAdmin);

export default router;