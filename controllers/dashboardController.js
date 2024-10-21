import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import logger from "../config/logger.js";
import { Consultation } from "../models/consultationModel.js";
import { Course } from "../models/courseModel.js";
import { Group } from "../models/groupModel.js";
import { Lead } from "../models/leadModal.js";
import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";
import { Event } from "../models/eventModel.js";

export const getAllStudentsCount = async (req, res) => {
  try {
    const studentsCount = await Student.countDocuments({
      deleted: false,
    });

    res.status(200).json(studentsCount);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getActiveStudentsCount = async (req, res) => {
  try {
    const studentsCount = await Student.countDocuments({
      deleted: false,
      "groups.status": "continue",
    });

    res.status(200).json(studentsCount);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getGroupsCount = async (req, res) => {
  try {
    const allGroupsCount = await Group.countDocuments();
    const waitingGroupsCount = await Group.countDocuments({
      status: "waiting",
    });
    const currentGroupsCount = await Group.countDocuments({
      status: "current",
    });
    const endedGroupsCount = await Group.countDocuments({
      status: "ended",
    });

    res.status(200).json({
      allGroupsCount,
      waitingGroupsCount,
      currentGroupsCount,
      endedGroupsCount,
    });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getAllEventsCount = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);

  try {
    const eventsCount = await Event.countDocuments({
      date: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    });

    res.status(200).json(eventsCount);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getConsultationsData = async (req, res) => {
  try {
    const leadsCount = await Lead.aggregate([
      {
        $group: {
          _id: null,
          totalLeadCount: { $sum: "$count" },
        },
      },
    ]);

    const plansCount = await Consultation.countDocuments();
    const consultationsCount = await Consultation.countDocuments({
      status: { $ne: "appointed" },
    });
    const salesCount = await Consultation.countDocuments({ status: "sold" });

    const result = {
      leadsCount: leadsCount[0]?.totalLeadCount || 0,
      plansCount,
      consultationsCount,
      salesCount,
    };

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getCoursesStatistics = async (req, res) => {
  try {
    const allCourses = await Course.find();

    const coursesStatistics = await Student.aggregate([
      { $unwind: "$courses" },
      {
        $group: {
          _id: "$courses",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = allCourses.map((course) => {
      const currentCourseItem = coursesStatistics.find(
        (item) => item._id?.toString() === course._id.toString()
      );
      if (currentCourseItem) {
        return { courseName: course.name, value: currentCourseItem.count };
      } else {
        return { courseName: course.name, value: 0 };
      }
    });

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getAdvertisingStatistics = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  const targetDate = calcDate(monthCount, startDate, endDate);

  try {
    const filterObj = {
      createdAt: {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      },
    };
    const studentsCount = await Student.countDocuments(filterObj);

    const advertisings = [
      { name: "İnstagram Sponsorlu", key: "instagramSponsor" },
      { name: "İnstagram standart", key: "instagramStandart" },
      { name: "İnstruktor Tövsiyyəsi", key: "instructorRecommend" },
      { name: "Dost Tövsiyyəsi", key: "friendRecommend" },
      { name: "Sayt", key: "site" },
      { name: "Tədbir", key: "event" },
      { name: "AİESEC", key: "AİESEC" },
      { name: "PO COMMUNİTY", key: "POCOMMUNİTY" },
      { name: "Köhnə tələbə", key: "oldStudent" },
      { name: "Staff tövsiyyəsi", key: "staffRecommend" },
      { name: "SMS REKLAMI", key: "smsAd" },
      { name: "PROMOKOD", key: "promocode" },
      { name: "Resale", key: "resale" },
      { name: "Digər", key: "other" },
    ];

    const advertisingStatistics = await Student.aggregate([
      { $unwind: "$whereComing" },
      { $match: filterObj },
      {
        $group: {
          _id: "$whereComing",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = advertisings.map((advertising) => {
      const currentAdvertising = advertisingStatistics.find(
        (item) => item._id === advertising.key
      );

      if (currentAdvertising) {
        const value = parseFloat(
          ((currentAdvertising.count * 100) / studentsCount).toFixed(2)
        );
        return {
          name: advertising.name,
          value,
        };
      } else {
        return {
          name: advertising.name,
          value: 0,
        };
      }
    });

    result.sort((a, b) => b.value - a.value);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getTachersResults = async (req, res) => {
  const { monthCount, startDate, endDate, byFilter } = req.query;
  let targetDate = calcDate(monthCount, startDate, endDate);

  try {
    const teachers = await Teacher.find().select("_id fullName");

    const teachersResultsList = await Promise.all(
      teachers.map(async (teacher) => {
        const confirmedLessons = await Lesson.find({
          teacher: teacher._id,
          role: "current",
          status: "confirmed",
          date: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        }).select("students");

        const totalLessonsCount = confirmedLessons.reduce(
          (total, lesson) =>
            total +
            lesson.students.filter((item) => item.attendance === 1).length,
          0
        );
        const totalStarsCount = confirmedLessons.reduce(
          (total, lesson) =>
            total +
            lesson.students
              .filter((item) => item.attendance === 1)
              .reduce((total, item) => total + item.ratingByStudent, 0),
          0
        );

        return {
          teacher,
          lessonCount: totalLessonsCount,
          starCount: totalStarsCount,
        };
      })
    );

    let index;
    if (byFilter === "lessonCount" && teachersResultsList.length) {
      teachersResultsList.sort((a, b) => b.lessonCount - a.lessonCount);
      index =
        teachersResultsList[2].lessonCount > 0
          ? 3
          : teachersResultsList[1].lessonCount > 0
          ? 2
          : teachersResultsList[0].lessonCount > 0
          ? 1
          : 0;
    } else if (byFilter === "starCount" && teachersResultsList.length) {
      teachersResultsList.sort((a, b) => b.starCount - a.starCount);
      index =
        teachersResultsList[2].starCount > 0
          ? 3
          : teachersResultsList[1].starCount > 0
          ? 2
          : teachersResultsList[0].starCount > 0
          ? 1
          : 0;
    }

    const result = {
      leaderTeacher: [...teachersResultsList.slice(0, index)],
      otherTeacher: [...teachersResultsList.slice(index)],
    };

    res.status(200).json(result);
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      query: req.query,
      for: "GET TEACHERS RESULTS FOR DASHBOARD",
      user: req.user,
      functionName: getTachersResults.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getLessonsCountChartData = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  try {
    let targetDate;

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if ((startDate, endDate)) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    const months = [];
    const studentsCountList = [];

    const test = await Student.find();

    while (targetDate.startDate <= targetDate.endDate) {
      const targetYear = targetDate.startDate.getFullYear();
      const currentDate = new Date(targetDate.startDate);
      currentDate.setMonth(targetDate.startDate.getMonth() + 1);

      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
      }).format(targetDate.startDate);

      const studentsCount = await Student.countDocuments({
        "groups.contractStartDate": {
          $lte: currentDate,
        },
        "groups.contractEndDate": {
          $gte: targetDate.startDate,
        },
      });

      months.push({
        month: monthName,
        year: targetYear,
      });
      studentsCountList.push(studentsCount);

      targetDate.startDate.setMonth(targetDate.startDate.getMonth() + 1);
    }

    res.status(200).json({ months, values: studentsCountList });
  } catch (err) {
    logger.error({
      method: "GET",
      status: 500,
      message: err.message,
      query: req.query,
      for: "GET LESSONS COUNT CHART DATA FOR DASHBOARD",
      user: req.user,
      functionName: getLessonsCountChartData.name,
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getWeeklyGroupTable = async (req, res) => {
  try {
    const groups = await Group.find({
      status: "current",
    })
      .select("-teachers -mentors -students")
      .populate("room");

    const result = groups
      .reduce((list, group) => {
        const newList = [...list];
        group.lessonDate.forEach((dateItem) => {
          const targetListItem = newList.find((listItem) => {
            return (
              (listItem.startTime || "") + (listItem.endTime || "") ===
              (dateItem.startTime || "") + (dateItem.endTime || "")
            );
          });

          if (targetListItem) {
            const checkExistGroup = targetListItem.groups.find(
              (item) => item._id === group._id
            );

            if (!checkExistGroup) {
              targetListItem.groups.push(group);
            }
          } else {
            newList.push({
              startTime: dateItem.startTime || "",
              endTime: dateItem.endTime || "",
              groups: [group],
            });
          }
        });

        return newList;
      }, [])
      .sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.startTime}`);
        const timeB = new Date(`1970-01-01T${b.startTime}`);

        return timeA - timeB;
      });

    console.log(result);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
