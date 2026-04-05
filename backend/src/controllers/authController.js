import jwt from "jsonwebtoken";
import streamifier from "streamifier";
import AdminUser from "../models/AdminUser.js";
import cloudinary from "../config/cloudinary.js";
import { logAction } from "../utils/logAction.js";

function sign(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function getFolderByRole(role = "ADMIN") {
  return role === "EMPLOYEE"
    ? "sudarshini-business/employee"
    : "sudarshini-business/admin";
}

async function uploadToCloudinary(fileBuffer, role = "ADMIN") {
  return new Promise((resolve, reject) => {
    const folder = getFolderByRole(role);

    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
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

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await AdminUser.findOne({ email: email?.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  await logAction({
    userName: user.name,
    action: "Login",
    ipAddress: req.ip,
  });

  res.json({
    token: sign(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      imagePublicId: user.imagePublicId,
    },
  });
}

export async function me(req, res) {
  res.json(req.user);
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await AdminUser.findById(req.user._id);

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  await logAction({
    userName: user.name,
    action: "Change Password",
    ipAddress: req.ip,
  });

  res.json({ message: "Password updated" });
}

export async function updateProfile(req, res) {
  const user = await AdminUser.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.email) user.email = req.body.email.toLowerCase().trim();

  const removeImage = String(req.body.removeImage || "").toLowerCase() === "true";

  if (req.file && process.env.CLOUDINARY_CLOUD_NAME) {
    const oldPublicId = user.imagePublicId || "";

    const result = await uploadToCloudinary(req.file.buffer, user.role);

    user.image = result.secure_url;
    user.imagePublicId = result.public_id;

    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }
  } else if (removeImage) {
    const oldPublicId = user.imagePublicId || "";

    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    user.image = "";
    user.imagePublicId = "";
  }

  await user.save();

  await logAction({
    userName: user.name,
    action: "Change Profile",
    ipAddress: req.ip,
  });

  res.json({
    message: "Profile updated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      imagePublicId: user.imagePublicId,
      role: user.role,
    },
  });
}