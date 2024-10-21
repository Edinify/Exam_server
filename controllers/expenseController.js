import { calcDate } from "../calculate/calculateDate.js";
import { Expense } from "../models/expenseModel.js";

// Get expenses for pagination
export const getExpensesForPagination = async (req, res) => {
  const { startDate, endDate, category, sort, length } = req.query;
  const limit = 20;

  try {
    let totalLength;
    let expenses;

    const filterObj = {};
    const sortObj = { date: -1 };

    if (startDate && endDate) {
      const targetDate = calcDate(null, startDate, endDate);

      filterObj.date = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }

    // if (sort === "lowestAmount") sortObj.amount = 1;

    // if (sort === "highestAmount") sortObj.amount = -1;

    // if (sort === "latest") sortObj.date = -1;

    // if (sort === "oldest") sortObj.date = 1;

    if (category && category !== "all") {
      filterObj.category = category;
    }

    totalLength = await Expense.countDocuments(filterObj);

    expenses = await Expense.find(filterObj)
      .sort(sortObj)
      .skip(length || 0)
      .limit(limit);

    console.log(filterObj, "filter obj");

    res.status(200).json({ expenses, totalLength });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create expense
export const createExpense = async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    await newExpense.save();

    res.status(201).json(newExpense);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(updatedExpense);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(deletedExpense);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
