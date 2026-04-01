import AdminUser from '../models/AdminUser.js';
import { logAction } from '../utils/logAction.js';
import cloudinary from '../config/cloudinary.js';

function uploadBufferToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'admins' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

export async function listAdmins(req, res) {
  try {
    const admins = await AdminUser.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load users' });
  }
}

export async function createAdmin(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await AdminUser.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    let imageUrl = '';

    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploaded.secure_url;
    }

    const admin = await AdminUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN',
      image: imageUrl
    });

    await logAction({
      userName: req.user.name,
      action: `Create Admin ${admin.email}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      image: admin.image
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create user' });
  }
}

export async function updateAdmin(req, res) {
  try {
    const admin = await AdminUser.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await AdminUser.findOne({
      email: normalizedEmail,
      _id: { $ne: admin._id }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    let imageUrl = admin.image || '';

    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploaded.secure_url;
    }

    admin.name = name.trim();
    admin.email = normalizedEmail;
    admin.role = role === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN';
    admin.image = imageUrl;

    await admin.save();

    await logAction({
      userName: req.user.name,
      action: `Update Admin ${admin.email}`,
      ipAddress: req.ip
    });

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      image: admin.image,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
}

export async function deleteAdmin(req, res) {
  try {
    const admin = await AdminUser.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await admin.deleteOne();

    await logAction({
      userName: req.user.name,
      action: `Delete Admin ${admin.email}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
}