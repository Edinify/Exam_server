import mongoose from "mongoose";
import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import logger from "../config/logger.js";
import { Consultation } from "../models/consultationModel.js";
import { Expense } from "../models/expenseModel.js";
import { Income } from "../models/incomeModel.js";
import { Lead } from "../models/leadModal.js";
import { Lesson } from "../models/lessonModel.js";

export const getFinance = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    let targetDate;

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const incomes = await Income.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const expenses = await Expense.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    const totalIncome = incomes.reduce(
      (total, income) => (total += income.amount),
      0
    );

    const totalExpense = expenses.reduce(
      (total, expense) => (total += expense.amount),
      0
    );

    const confirmedLessons = await Lesson.find({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
      role: "current",
      status: "confirmed",
    });

    const totalEarnings = confirmedLessons.reduce(
      (total, lesson) => total + lesson.earnings,
      0
    );

    const turnover = totalEarnings;

    const profit = turnover - totalExpense;

    const result = {
      income: totalIncome.toFixed(2),
      expense: totalExpense.toFixed(2),
      turnover: turnover.toFixed(2),
      profit: profit.toFixed(2),
    };

    res.status(200).json(result);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      query: req.query,
      for: "GET FINANCE",
      user: req.user,
      functionName: getFinance.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getChartData = async (req, res) => {
  const { monthCount, startDate, endDate, courseId } = req.query;

  console.log(req.query, "ddddddddddddddddddddkkkkkkkkk");
  try {
    let targetDate;
    let chartData = {};
    let filterObj = {};

    if (courseId) {
      filterObj.course = new mongoose.Types.ObjectId(courseId);
    }

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    if (monthCount == 1 || (startDate && startDate === endDate)) {
      chartData = await getChartDataOneMonth(targetDate, filterObj);
    } else {
      chartData = await getChartDataManyMonth(targetDate, filterObj);
    }

    res.status(200).json(chartData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

async function getChartDataOneMonth(targetDate, filterObj) {
  const result = {
    series: [
      {
        name: "Lead",
        data: [],
      },
      {
        name: "Planlanan",
        data: [],
      },
      {
        name: "Konsultasiya",
        data: [],
      },
      {
        name: "Satış",
        data: [],
      },
    ],

    categories: [],
  };

  console.log(filterObj, "filter objjjjjj");
  const plansCountList = await Consultation.aggregate([
    {
      $match: {
        ...filterObj,
        contactDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%d", date: "$contactDate" } },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  console.log(plansCountList, "plans count list");

  const consultationsCountList = await Consultation.aggregate([
    {
      $match: {
        constDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        status: { $ne: "appointed" },
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%d", date: "$constDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const salesCountList = await Consultation.aggregate([
    {
      $match: {
        constDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        status: "sold",
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%d", date: "$constDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const leadCountList = await Lead.aggregate([
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
        _id: { $dateToString: { format: "%d", date: "$date" } },
        total: { $sum: "$count" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const currentDate = new Date(targetDate.startDate);

  while (currentDate < targetDate.endDate) {
    const currentDay = currentDate.getDate();

    const currLeadCount = leadCountList.find((item) => item._id == currentDay);
    const currPlanCount = plansCountList.find((item) => item._id == currentDay);
    const currConsultationCount = consultationsCountList.find(
      (item) => item._id == currentDay
    );
    const currSaleCount = salesCountList.find((item) => item._id == currentDay);

    if (currLeadCount) {
      result.series[0].data.push(currLeadCount.total);
    } else {
      result.series[0].data.push(0);
    }

    if (currPlanCount) {
      result.series[1].data.push(currPlanCount.total);
    } else {
      result.series[1].data.push(0);
    }

    if (currConsultationCount) {
      result.series[2].data.push(currConsultationCount.total);
    } else {
      result.series[2].data.push(0);
    }

    if (currSaleCount) {
      result.series[3].data.push(currSaleCount.total);
    } else {
      result.series[3].data.push(0);
    }

    result.categories.push(currentDay);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

async function getChartDataManyMonth(targetDate, filterObj) {
  console.log("salam");
  const result = {
    series: [
      {
        name: "Lead",
        data: [],
      },
      {
        name: "Planlanan",
        data: [],
      },
      {
        name: "Konsultasiya",
        data: [],
      },
      {
        name: "Satış",
        data: [],
      },
    ],

    categories: [],
  };

  const months = [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "Iyn",
    "Iyn",
    "Avq",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ];
  const plansCountList = await Consultation.aggregate([
    {
      $match: {
        contactDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$contactDate" },
          month: { $month: "$contactDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const consultationsCountList = await Consultation.aggregate([
    {
      $match: {
        constDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        status: { $ne: "appointed" },
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$constDate" },
          month: { $month: "$constDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const salesCountList = await Consultation.aggregate([
    {
      $match: {
        constDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        status: "sold",
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$constDate" },
          month: { $month: "$constDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const leadCountList = await Lead.aggregate([
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
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        total: { $sum: "$count" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  console.log(leadCountList, "leadCountList");

  const currentDate = new Date(targetDate.startDate);

  while (currentDate < targetDate.endDate) {
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currLeadCount = leadCountList.find(
      (item) => item._id.year == currentYear && item._id.month == currentMonth
    );
    const currPlanCount = plansCountList.find(
      (item) => item._id.year == currentYear && item._id.month == currentMonth
    );
    const currConsultationCount = consultationsCountList.find(
      (item) => item._id.year == currentYear && item._id.month == currentMonth
    );
    const currSaleCount = salesCountList.find(
      (item) => item._id.year == currentYear && item._id.month == currentMonth
    );

    if (currLeadCount) {
      result.series[0].data.push(currLeadCount.total);
    } else {
      result.series[0].data.push(0);
    }

    if (currPlanCount) {
      result.series[1].data.push(currPlanCount.total);
    } else {
      result.series[1].data.push(0);
    }

    if (currConsultationCount) {
      result.series[2].data.push(currConsultationCount.total);
    } else {
      result.series[2].data.push(0);
    }

    if (currSaleCount) {
      result.series[3].data.push(currSaleCount.total);
    } else {
      result.series[3].data.push(0);
    }

    result.categories.push(`${currentYear}, ${months[currentMonth - 1]}`);

    currentDate.setMonth(currentMonth);
  }

  return result;
}
