import moment from "moment";
import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Group } from "../models/groupModel.js";
import { Lesson } from "../models/lessonModel.js";
import { Salary } from "../models/salaryModel.js";
import { Teacher } from "../models/teacherModel.js";
import mongoose from "mongoose";

// GET

export const getSalariesForTargetWorker = async (req, res) => {
  const { workerId } = req.params;
  try {
    const salaries = Salary.find({ workerId });

    res.status(200).json(salaries);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

const calculateSalary = async (teacher, targetDate) => {
  const targetGroups = await Group.find({
    teachers: teacher._id,
    status: { $ne: "waiting" },
  }).populate("students");

  const savedSalary = await Salary.findOne({
    teacher: teacher._id,
    date: {
      $gte: targetDate.startDate,
      $lte: targetDate.endDate,
    },
  });

  let totalSalary = 0;
  const salariesListEveryStudent = [];

  for (const group of targetGroups) {
    for (const student of group.students) {
      const targetGroupItem = student.groups.find(
        (item) => item.group.toString() === group._id.toString()
      );

      const contracts = targetGroupItem.contracts.sort(
        (a, b) => a.contractStartDate - b.contractStartDate
      );

      for (let i = 0; i < contracts.length; i++) {
        const currentContract = contracts[i];
        const currentDate = moment.tz("Asia/Baku").endOf("day").toDate();

        const lessonsData = await Lesson.aggregate([
          {
            $match: {
              group: new mongoose.Types.ObjectId(group._id),
              status: "confirmed",
              date: {
                $gte: targetDate.startDate,
                $lte: targetDate.endDate,
              },
              students: {
                $elemMatch: {
                  student: new mongoose.Types.ObjectId(student._id),
                  attendance: 1,
                },
              },
            },
          },
          {
            $match: {
              date: {
                $gte: currentContract.contractStartDate,
                $lte: currentContract?.contractEndDate || currentDate,
              },
            },
          },
          {
            $count: "totalLessons",
          },
        ]);

        const lessonsCount = lessonsData[0]?.totalLessons || 0;

        const monthlyStudentPayment = currentContract?.monthlyPayment || 0;
        const teacherSalaryForStudentPayment = monthlyStudentPayment / 2;
        const calculatedPart =
          lessonsCount === 0 ? 0 : lessonsCount > 12 ? 1 : lessonsCount / 12;

        const calculatedPureSalary =
          teacherSalaryForStudentPayment * calculatedPart;

        totalSalary += Number(calculatedPureSalary.toFixed(2));

        salariesListEveryStudent.push({
          student,
          group,
          contractName: `Müqavilə ${i + 1}`,
          contractStartDate: currentContract.contractStartDate,
          contractEndDate: currentContract?.contractEndDate || currentDate,
          studentMonthlyPayment: currentContract?.monthlyPayment || 0,
          lessonsCount,
          teacherSalaryToStudentPayment: calculatedPureSalary.toFixed(2),
        });
      }
    }
  }

  const rest = totalSalary - (savedSalary?.paid || 0);
  const date = new Date(targetDate.startDate);
  date.setDate(date.getDate() + 15);
  return {
    _id: teacher._id,
    teacher,
    totalSalary: totalSalary.toFixed(2),
    salariesListEveryStudent,
    paid: savedSalary?.paid ? savedSalary.paid.toFixed(2) : (0).toFixed(2),
    rest: rest > 0 ? rest.toFixed(2) : (0).toFixed(2),
    date,
  };
};

export const getSalariesForAdmins = async (req, res) => {
  const { startDate, endDate, searchQuery, length } = req.query;
  const limit = 20;

  try {
    let selectedDate = startDate ? new Date(startDate) : "";
    console.log(selectedDate, "selected Date");
    if (selectedDate) selectedDate.setDate(selectedDate.getDate() + 15);
    let totalLength;
    let targetDate;
    let teachers;
    let result;
    const filterObj = { deleted: false };

    console.log(selectedDate);

    targetDate = calcDateWithMonthly(selectedDate, selectedDate);
    console.log(targetDate);

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      filterObj.fullName = { $regex: regexSearchQuery };
    }

    const teachersCount = await Teacher.countDocuments(filterObj);
    totalLength = teachersCount;

    teachers = await Teacher.find(filterObj)
      .skip(length || 0)
      .limit(limit)
      .select("fullName");

    result = await Promise.all(
      teachers.map(async (teacher) => {
        return await calculateSalary(teacher, targetDate);
      })
    );

    // console.log(result);

    res.status(200).json({ salariesData: result, totalLength });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getSalariesForTeacher = async (req, res) => {
  const { startDate, endDate, monthCount } = req.query;
  const { id } = req.user;

  console.log(req.query);

  try {
    let targetMonth;
    let targetDate = calcDate(monthCount, startDate, endDate);
    const teacher = await Teacher.findById(id);

    const confirmedLessons = await Lesson.find({
      teacher: id,
      role: "current",
      status: "confirmed",
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    let totalSalary = 0;
    let participantCount = 0;
    let totalBonus = 0;

    confirmedLessons.forEach((lesson) => {
      participantCount += lesson.students.filter(
        (item) => item.attendance === 1 || item.attendance === -1
      ).length;

      if (lesson.salary.monthly) {
        if (targetMonth !== lesson.date.getMonth()) {
          totalSalary += lesson.salary.value;
          targetMonth = lesson.date.getMonth();
        }
      } else if (lesson.salary.hourly) {
        totalSalary +=
          lesson.salary.value *
          lesson.students.filter(
            (item) => item.attendance === 1 || item.attendance === -1
          ).length;
      }
    });

    const result = {
      _id: id,
      salary: teacher.salary,
      totalSalary: totalSalary,
      participantCount: participantCount,
      bonus: totalBonus,
    };

    res.status(200).json({ salary: result });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// CREATE OR UPDATE
export const addSalary = async (req, res) => {
  const { teacher, paid, date, rest } = req.body;
  try {
    let targetDate = calcDateWithMonthly(date, date);

    console.log(targetDate, "add salary");
    let newSalary = await Salary.findOneAndUpdate(
      {
        teacher: teacher._id,
        date: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
      },
      {
        paid,
      },
      { new: true }
    ).populate({
      path: "teacher",
      select: "fullName",
    });

    if (!newSalary) {
      const date = targetDate.startDate;

      date.setDate(date.getDate() + 15);

      newSalary = new Salary({ teacher, paid, date });
      await newSalary.save();
      await newSalary.populate({
        path: "teacher",
        select: "fullName",
      });
      targetDate = calcDateWithMonthly(date, date);
    }

    const result = await calculateSalary(newSalary.teacher, targetDate);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
