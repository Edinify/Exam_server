import logger from "../config/logger.js";
import { Course } from "../models/courseModel.js";
import { Syllabus } from "../models/syllabusModel.js";
import { Worker } from "../models/workerModel.js";
import exceljs from "exceljs";

// Get syllabus
export const getSyllabus = async (req, res) => {
  const { courseId } = req.query;
  try {
    const syllabus = await Syllabus.find({ courseId });

    res.status(200).json(syllabus);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get syllabus for pagination
export const getSyllabusForPagination = async (req, res) => {
  const { searchQuery, courseId, length } = req.query;
  const limit = 20;

  try {
    let totalLength;
    let syllabusData;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const syllabusCount = await Syllabus.countDocuments({
        name: { $regex: regexSearchQuery },
        courseId,
      });

      syllabusData = await Syllabus.find({
        name: { $regex: regexSearchQuery },
        courseId,
      })
        .skip(length || 0)
        .limit(limit)
        .sort({ orderNumber: 1 });

      totalLength = syllabusCount;
    } else {
      const syllabusCount = await Syllabus.countDocuments({ courseId });
      totalLength = syllabusCount;
      syllabusData = await Syllabus.find({ courseId })
        .skip(length || 0)
        .sort({ orderNumber: 1 })
        .limit(limit);
    }
    res.status(200).json({ syllabusData, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create syllabus
export const createSyllabus = async (req, res) => {
  const { orderNumber, courseId } = req.body;

  try {
    const existingSyllabus = await Syllabus.findOne({
      orderNumber,
      courseId,
    });

    if (existingSyllabus) {
      return res.status(409).json({ key: "syllabus-already-exists" });
    }

    const newSyllabus = new Syllabus(req.body);
    await newSyllabus.save();

    res.status(201).json(newSyllabus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// Update syllabus
export const updateSyllabus = async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;
  const { orderNumber, courseId } = req.body;
  let updatedData = req.body;

  try {
    const existingSyllabus = await Syllabus.findOne({
      orderNumber,
      courseId,
      _id: { $ne: id },
    });

    if (existingSyllabus) {
      return res.status(409).json({ key: "syllabus-already-exists" });
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "syllabus"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;

        updatedData = { changes: updatedData };
      }
    }

    const updatedSyllabus = await Syllabus.findByIdAndUpdate(id, updatedData, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedSyllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    res.status(200).json(updatedSyllabus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete syllabus
export const deleteSyllabus = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSyllabus = await Syllabus.findByIdAndDelete(id);

    if (!deletedSyllabus) {
      return res.status(404).json({ message: "syllabus not found" });
    }

    res.status(200).json(deletedSyllabus);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Confirm syllabus changes
export const confirmSyllabusChanges = async (req, res) => {
  const { id } = req.params;
  const { changes } = req.body;

  try {
    const syllabus = await Syllabus.findByIdAndUpdate(
      id,
      { ...changes, changes: {} },
      { new: true }
    );

    if (!syllabus) {
      return res.status(404).json({ message: "Syllabus not found" });
    }

    res.status(200).json(syllabus);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Cancel course changes
export const cancelSyllabusChanges = async (req, res) => {
  const { id } = req.params;

  try {
    const syllabus = await Syllabus.findByIdAndUpdate(
      id,
      { changes: {} },
      { new: true }
    );

    res.status(200).json(syllabus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Export excel file
export const exportSyllabusExcel = async (req, res) => {
  const { courseId } = req.query;
  const headerStyle = {
    font: { bold: true },
  };

  try {
    const course = await Course.findById(courseId);
    const syllabus = await Syllabus.find({ courseId }).sort({ orderNumber: 1 });

    const workbook = new exceljs.Workbook();

    const sheet = workbook.addWorksheet("syllabus");

    sheet.columns = [{ header: course.name, key: "name", width: 30 }];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
    });

    syllabus.forEach((item) => {
      sheet.addRow({
        name: item?.name ? item.name : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=syllabus.xlsx");
    workbook.xlsx.write(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
