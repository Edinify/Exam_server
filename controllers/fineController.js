import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import logger from "../config/logger.js";
import { Fine } from "../models/fineModel.js";
import { Teacher } from "../models/teacherModel.js";

// Create
export const createFine = async (req, res) => {
  try {
    const fine = await Fine.create(req.body);

    const fineCount = await Fine.countDocuments();
    const lastPage = Math.ceil(fineCount / 10);

    res.status(201).json({ fine, lastPage });
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      postedData: req.body,
      for: "CREATE FINE",
      user: req.user,
      functionName: createFine.name,
    });
    res.status(500).json({ message: err.message });
  }
};

// Get
export const getFinesWithPagination = async (req, res) => {
  const { searchQuery, startDate, endDate, fineType } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  console.log(req.query);
  try {
    let targetDate;
    let totalPages;
    let fines;
    const filterObj = {};

    if (startDate && endDate) {
      targetDate = calcDate(null, startDate, endDate);
    } else {
      targetDate = calcDateWithMonthly(new Date(), new Date());
    }

    filterObj.createdAt = {
      $gte: targetDate.startDate,
      $lte: targetDate.endDate,
    };

    if (fineType) {
      filterObj.fineType = fineType;
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const teachers = await Teacher.find({
        fullName: { $regex: regexSearchQuery },
      }).select("_id");

      const teachersIds = teachers.map((teacher) => teacher._id);
      const finesCount = await Fine.countDocuments({
        teacher: { $in: teachersIds },
        ...filterObj,
      });

      fines = await Fine.find({
        teacher: { $in: teachersIds },
        ...filterObj,
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher");

      totalPages = Math.ceil(finesCount / limit);
    } else {
      const finesCount = await Fine.countDocuments(filterObj);
      totalPages = Math.ceil(finesCount / limit);
      fines = await Fine.find(filterObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("teacher");
    }

    res.status(200).json({ fines, totalPages });
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      query: req.query,
      for: "GET FINES FOR PAGINATION",
      user: req.user,
      functionName: getFinesWithPagination.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getFinesForTeacher = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const { id } = req.user;

  try {
    let targetDate = calcDate(monthCount, startDate, endDate);

    const filterObj = {
      teacher: id,
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    };

    const fines = await Fine.find(filterObj);

    res.status(200).json(fines);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      query: req.query,
      for: "GET FINES FOR TEACHER",
      user: req.user,
      functionName: getFinesForTeacher.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// UPDATE
export const updateFine = async (req, res) => {
  const { id } = req.params;

  console.log(id);
  console.log(req.body);
  try {
    const updatedFine = await Fine.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedFine) {
      return res.status(404).json({ key: "fine-not-found" });
    }

    res.status(200).json(updatedFine);
  } catch (err) {
    logger.error({
      method: "PATCH",
      status: 500,
      message: err.message,
      updatedData: req.body,
      fineId: id,
      for: "UPDATE FINE",
      user: req.user,
      functionName: updateFine.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete
export const deleteFine = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedFine = await Fine.findByIdAndDelete(id);

    if (!deletedFine) {
      return res.status(404).json({ key: "fine-not-found" });
    }

    res.status(200).json({ message: "Fine successfully deleted" });
  } catch (err) {
    logger.error({
      method: "DELETE",
      status: 500,
      message: err.message,
      fineId: id,
      for: "DELETE FINE",
      user: req.user,
      functionName: deleteFine.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};
