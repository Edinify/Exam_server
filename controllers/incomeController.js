import { calcDate } from "../calculate/calculateDate.js";
import logger from "../config/logger.js";
import { Income } from "../models/incomeModel.js";

// Get incomes for pagination
export const getIncomesForPagination = async (req, res) => {
  const { monthCount, startDate, endDate, category, sort } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const targetDate = calcDate(monthCount, startDate, endDate);

  try {
    let totalPages;
    let incomes;

    const filterObj = {};
    const sortObj = {};

    if (sort === "lowestAmount") sortObj.amount = 1;

    if (sort === "highestAmount") sortObj.amount = -1;

    if (sort === "latest") sortObj.date = -1;

    if (sort === "oldest") sortObj.date = 1;

    if (category) {
      filterObj.category = category;
    }

    filterObj.date = {
      $gte: targetDate.startDate,
      $lte: targetDate.endDate,
    };

    const incomesCount = await Income.countDocuments(filterObj);

    totalPages = Math.ceil(incomesCount / limit);

    incomes = await Income.find(filterObj)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    const allIncomes = await Income.find();
    console.log(allIncomes);

    res.status(200).json({ incomes, totalPages });
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      query: req.query,
      for: "GET INCOMES FOR PAGINATION",
      user: req.user,
      functionName: getIncomesForPagination.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create income
export const createIncome = async (req, res) => {
  try {
    const newIncome = new Income(req.body);
    await newIncome.save();

    const incomesCount = await Income.countDocuments();
    const lastPage = Math.ceil(incomesCount / 10);

    console.log(incomesCount, "incomes count");
    console.log(lastPage, "last page");

    res.status(201).json({ income: newIncome, lastPage });
  } catch (err) {
    logger.error({
      method: "POST",
      status: 500,
      message: err.message,
      postedData: req.body,
      for: "CREATE INCOME",
      user: req.user,
      functionName: createIncome.name,
    });
    res.status(500).json({ error: err.message });
  }
};

// Update income
export const updateIncome = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedIncome = await Income.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedIncome) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(updatedIncome);
  } catch (err) {
    logger.error({
      method: "PATCH",
      status: 500,
      message: err.message,
      incomeId: id,
      updatedData: req.body,
      for: "UPDATE INCOME",
      user: req.user,
      functionName: updateIncome.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete income
export const deleteIncome = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedIncome = await Income.findByIdAndDelete(id);

    if (!deletedIncome) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense successfully deleted" });
  } catch (err) {
    logger.error({
      method: "DELETE",
      status: 500,
      message: err.message,
      incomeId: id,
      for: "DELETE INCOME",
      user: req.user,
      functionName: deleteIncome.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};
