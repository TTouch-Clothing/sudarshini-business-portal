import AdminUser from "../models/AdminUser.js";
import { logAction } from "../utils/logAction.js";
import cloudinary from "../config/cloudinary.js";

function getFolderByRole(role = "ADMIN") {
  return role === "EMPLOYEE"
    ? "sudarshini-business/employee"
    : "sudarshini-business/admin";
}

function uploadBufferToCloudinary(fileBuffer, role = "ADMIN") {
  return new Promise((resolve, reject) => {
    const folder = getFolderByRole(role);

    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
  }
}

export async function listAdmins(req, res) {
  try {
    const admins = await AdminUser.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to load users" });
  }
}

export async function createAdmin(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await AdminUser.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let imageUrl = "";
    let imagePublicId = "";
    const normalizedRole = role === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN";

    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        normalizedRole
      );
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    const admin = await AdminUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      image: imageUrl,
      imagePublicId,
    });

    await logAction({
      userName: req.user.name,
      action: `Create Admin ${admin.email}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      image: admin.image,
      imagePublicId: admin.imagePublicId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create user" });
  }
}

export async function updateAdmin(req, res) {
  try {
    const admin = await AdminUser.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN";
    const removeImage = String(req.body.removeImage || "").toLowerCase() === "true";

    const existingUser = await AdminUser.findOne({
      email: normalizedEmail,
      _id: { $ne: admin._id },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let imageUrl = admin.image || "";
    let imagePublicId = admin.imagePublicId || "";

    if (req.file) {
      const oldPublicId = admin.imagePublicId || "";

      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        normalizedRole
      );

      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;

      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    } else if (removeImage) {
      const oldPublicId = admin.imagePublicId || "";

      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }

      imageUrl = "";
      imagePublicId = "";
    }

    admin.name = name.trim();
    admin.email = normalizedEmail;
    admin.role = normalizedRole;
    admin.image = imageUrl;
    admin.imagePublicId = imagePublicId;

    await admin.save();

    await logAction({
      userName: req.user.name,
      action: `Update Admin ${admin.email}`,
      ipAddress: req.ip,
    });

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      image: admin.image,
      imagePublicId: admin.imagePublicId,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update user" });
  }
}

export async function deleteAdmin(req, res) {
  try {
    const admin = await AdminUser.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.imagePublicId) {
      await deleteFromCloudinary(admin.imagePublicId);
    }

    await admin.deleteOne();

    await logAction({
      userName: req.user.name,
      action: `Delete Admin ${admin.email}`,
      ipAddress: req.ip,
    });

    res.json({ message: "Admin deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete user" });
  }
}