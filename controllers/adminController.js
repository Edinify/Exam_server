import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";
import logger from "../config/logger.js";

// Get admin
export const getAdmin = async (req, res) => {
  const { id } = req.user;
  try {
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: "admin not found" });
    }

    res.status(200).json(admin);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET ADMIN",
      functionName: getAdmin.name,
      user: req.user,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

// Get admins
export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();

    res.status(200).json(admins);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET ADMINS",
      functionName: getAdmins.name,
      user: req.user,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const updatedData = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });

    if (
      (existingAdmin && existingAdmin._id != id) ||
      existingStudent ||
      existingTeacher
    ) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    if (updatedData.password && updatedData.password.length > 5) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData.password = hashedPassword;
    } else {
      delete updatedData.password;
    }

    const newAdmin = await Admin.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(newAdmin);
  } catch (err) {
    logger.error({
      method: "PATCH",
      status: 500,
      message: err.message,
      for: "UPDATE ADMIN",
      user: req.user,
      postedData: {
        ...req.body,
        password: "",
      },
      functionName: updateAdmin.name,
    });

    res.status(500).json({
      message: {
        error: err.message,
      },
    });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ key: "admin-not-found" });
    }

    res.status(200).json(deleteAdmin);
  } catch (err) {
    logger.error({
      method: "DELETE",
      status: 500,
      message: err.message,
      for: "DELETE ADMIN",
      user: req.user,
      deleteAdminId: id,
      functionName: deleteAdmin.name,
    });

    res.status(500).json({ message: { error: err.message } });
  }
};

// Update admin password with old password
export const updateAdminPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  try {
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, admin.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ key: "old-password-incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// update admin password without checking oldpassword
export const updateAdminPasswordWithoutCheckingOldPassword = async (
  req,
  res
) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedAdmin) {
      res.status(404).json({ message: "Not found admin" });
    }

    res.status(200).json({ message: "success updated password" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
