import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Expense } from "../models/expenseModel.js";
import { Salary } from "../models/salaryModel.js";
import { Student } from "../models/studentModel.js";

export const getFinance = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    let targetDate;

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const incomeData = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $unwind: "$groups.paids",
      },
      {
        $match: {
          "groups.paids.paymentDate": {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
          "groups.paids.confirmed": true,
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: "$groups.paids.payment",
          },
        },
      },
    ]);

    const totalIncome = incomeData.length > 0 ? incomeData[0].totalIncome : 0;
    console.log(incomeData);
    console.log(totalIncome);

    const expenseData = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalExpense =
      expenseData.length > 0 ? expenseData[0].totalExpense : 0;

    const salaryData = await Salary.aggregate([
      {
        $match: {
          date: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSalary: {
            $sum: "$paid",
          },
        },
      },
    ]);

    const totalSalary = salaryData.length > 0 ? salaryData[0].totalSalary : 0;

    let profit = totalIncome - totalExpense - totalSalary;

    console.log(incomeData);
    console.log(totalExpense);
    console.log(totalSalary);
    console.log(profit, "profit");

    const result = {
      income: totalIncome.toFixed(2),
      expense: totalExpense.toFixed(2),
      salary: totalSalary.toFixed(2),
      profit: profit.toFixed(2),
    };

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getChartData = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    let targetDate;

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const months = [];
    const chartIncome = [];
    const chartExpense = [];
    const chartProfit = [];

    while (targetDate.startDate <= targetDate.endDate) {
      const targetYear = targetDate.startDate.getFullYear();
      const targetEndDate = calcDateWithMonthly(
        targetDate.startDate,
        targetDate.startDate
      ).endDate;

      const incomeData = await Student.aggregate([
        {
          $match: {
            deleted: false,
          },
        },
        {
          $unwind: "$groups",
        },
        {
          $unwind: "$groups.paids",
        },
        {
          $match: {
            "groups.paids.paymentDate": {
              $gte: targetDate.startDate,
              $lte: targetEndDate,
            },
            "groups.paids.confirmed": true,
          },
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: "$groups.paids.payment",
            },
          },
        },
      ]);

      const totalIncome = incomeData.length > 0 ? incomeData[0].totalIncome : 0;

      const expenseData = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: targetDate.startDate,
              $lte: targetEndDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalExpense: {
              $sum: "$amount",
            },
          },
        },
      ]);

      const totalExpense =
        expenseData.length > 0 ? expenseData[0].totalExpense : 0;

      const salaryData = await Salary.aggregate([
        {
          $match: {
            date: {
              $gte: targetDate.startDate,
              $lte: targetEndDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSalary: {
              $sum: "$paid",
            },
          },
        },
      ]);

      const totalSalary = salaryData.length > 0 ? salaryData[0].totalSalary : 0;

      let profit = totalIncome - totalExpense - totalSalary;

      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
      }).format(targetDate.startDate);

      months.push({ month: monthName, year: targetYear });
      chartIncome.push(totalIncome.toFixed(2));
      chartExpense.push((totalExpense + totalSalary).toFixed(2));
      chartProfit.push(profit.toFixed(2));

      targetDate.startDate.setMonth(targetDate.startDate.getMonth() + 1);
    }

    res.status(200).json({ months, chartIncome, chartExpense, chartProfit });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
