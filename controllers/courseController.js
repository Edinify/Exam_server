import logger from "../config/logger.js";
import { Course } from "../models/courseModel.js";
import { Worker } from "../models/workerModel.js";
import exceljs from "exceljs";

// Get courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();

    res.status(200).json(courses);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      for: "GET COURSES",
      user: req.user,
      functionName: getCourses.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get courses for pagination
export const getCoursesForPagination = async (req, res) => {
  const { searchQuery, length } = req.query;
  const limit = 20;

  try {
    let totalLength;
    let courses;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const coursesCount = await Course.countDocuments({
        name: { $regex: regexSearchQuery },
        deleted: false,
      });

      courses = await Course.find({
        name: { $regex: regexSearchQuery },
        deleted: false,
      })
        .skip(length || 0)
        .limit(limit)
        .sort({ createdAt: -1 });

      totalLength = coursesCount;
    } else {
      const coursesCount = await Course.countDocuments({ deleted: false });
      totalLength = coursesCount;
      courses = await Course.find({ deleted: false })
        .skip(length || 0)
        .limit(limit)
        .sort({ createdAt: -1 });
    }

    res.status(200).json({ courses, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create course
export const createCourse = async (req, res) => {
  const { name } = req.body;

  try {
    const regexName = new RegExp(name || "", "i");

    const existingCourse = await Course.findOne({
      name: { $regex: regexName },
    });

    if (existingCourse) {
      return res.status(409).json({ key: "course-already-exists" });
    }

    const newCourse = new Course(req.body);
    await newCourse.save();

    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  try {
    const regexName = new RegExp(`^${name.trim()}$` || "", "i");

    const existingCourse = await Course.findOne({
      name: { $regex: regexName },
      _id: { $ne: id },
    });

    console.log(req.body);
    console.log(existingCourse);

    if (existingCourse) {
      return res.status(409).json({ key: "course-already-exists" });
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "courses"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;

        updatedData = { changes: updatedData };
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, updatedData, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCourse = await Course.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );

    if (!deletedCourse) {
      return res.status(404).json({ message: "course not found" });
    }

    res.status(200).json(deletedCourse);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Confirm course changes
export const confirmCourseChanges = async (req, res) => {
  const { id } = req.params;
  const { changes } = req.body;

  try {
    const course = await Course.findByIdAndUpdate(
      id,
      { ...changes, changes: {} },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Cancel course changes
export const cancelCourseChanges = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findByIdAndUpdate(
      id,
      { changes: {} },
      { new: true }
    );

    res.status(200).json(course);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Export excel file

export const exportCoursesExcel = async (req, res) => {
  const headerStyle = {
    font: { bold: true },
  };
  try {
    const courses = await Course.find();

    const workbook = new exceljs.Workbook();

    const sheet = workbook.addWorksheet("courses");

    sheet.columns = [
      { header: "İxtisas", key: "name", width: 30 },
      { header: "Tam", key: "total", width: 15 },
      { header: "Tədris müddəti", key: "lessonTime", width: 15 },
      { header: "10 Hissəli", key: "tenPart", width: 15 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
    });

    courses.forEach((course) => {
      const total = course.payments.find((item) => item.paymentType === "Tam");
      const lessonTime = course.payments.find(
        (item) => item.paymentType === "Tədris müddəti"
      );
      const tenPart = course.payments.find(
        (item) => item.paymentType === "10 hissəli"
      );
      sheet.addRow({
        name: course?.name || "",
        total: total?.payment ? `${total.payment} AZN` : "",
        lessonTime: `${lessonTime?.payment ? lessonTime.payment + "AZN" : ""}/${
          lessonTime?.part ? lessonTime.part + "hissəli" : ""
        }`,
        tenPart: tenPart?.payment ? `${tenPart.payment} AZN` : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=courses.xlsx");
    workbook.xlsx.write(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
