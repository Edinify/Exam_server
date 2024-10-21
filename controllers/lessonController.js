import { Lesson } from "../models/lessonModel.js";
import { calcDate } from "../calculate/calculateDate.js";
import { Syllabus } from "../models/syllabusModel.js";
import { Worker } from "../models/workerModel.js";
import { Student } from "../models/studentModel.js";
import moment from "moment-timezone";

// Create lesson
export const createLesson = async (req, res) => {
  const { date } = req.body;
  const day = new Date(date).getDay();

  try {
    const newLesson = new Lesson({
      ...req.body,
      day: day == 0 ? 7 : day,
    });

    await newLesson.save();

    const lesson = await Lesson.findById(newLesson._id)
      .populate("teacher mentor")
      .populate({ path: "students.student", select: "-groups" })
      .populate({
        path: "group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    res.status(201).json(lesson);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create lessons
export const createLessons = async (group) => {
  const {
    startDate,
    endDate,
    lessonDate,
    _id,
    course,
    students,
    teachers,
    mentors,
    status,
  } = group;

  console.log(startDate);
  console.log(new Date(startDate));
  try {
    if (
      !startDate ||
      !endDate ||
      lessonDate.length == 0 ||
      status === "waiting"
    )
      return true;

    const checkLessons = await Lesson.findOne({ group: _id });

    if (checkLessons) return true;

    const syllabus = await Syllabus.find({ courseId: course }).sort({
      orderNumber: 1,
    });
    let syllabusIndex = 0;
    const lessons = [];

    let currentStartDate = moment
      .tz(startDate, "UTC")
      .tz("Asia/Baku")
      .startOf("day");
    const endMoment = moment.tz(endDate, "UTC").tz("Asia/Baku").endOf("day");

    while (currentStartDate.isSameOrBefore(endMoment)) {
      // const currentDay = startDate.getDay() > 0 ? startDate.getDay() : 7;
      const currentDay =
        currentStartDate.day() > 0 ? currentStartDate.day() : 7;
      const checkDay = lessonDate?.find((item) => item.day === currentDay);

      if (checkDay) {
        // const currentDate = new Date(startDate);
        const currentDate = currentStartDate.toDate();
        const studentsObj = students.map((student) => ({
          student,
        }));
        let newLesson;

        if (checkDay?.practical) {
          newLesson = {
            group: _id,
            course: course,
            date: currentDate,
            day: checkDay.day,
            startTime: checkDay.startTime,
            endTime: checkDay.endTime,
            students: studentsObj,
            teacher: teachers[0],
            mentor: mentors[0],
            topic: {
              name: "Praktika",
            },
          };
        } else {
          newLesson = {
            group: _id,
            course: course,
            date: currentDate,
            day: checkDay.day,
            startTime: checkDay.startTime,
            endTime: checkDay.endTime,
            students: studentsObj,
            teacher: teachers[0],
            mentor: mentors[0],
            topic: syllabus[syllabusIndex],
          };
          syllabusIndex++;
        }

        lessons.push(newLesson);
      }

      // startDate.setDate(startDate.getDate() + 1);
      currentStartDate.add(1, "day");
    }

    const result = await Lesson.insertMany(lessons);

    return true;
  } catch (err) {
    console.log(err.message);
    return false;
  }
};

export const getLessons = async (req, res) => {
  const { length, groupId, startDate, endDate, status } = req.query;
  const limit = 20;

  try {
    const filterObj = {
      group: groupId,
    };

    if (startDate && endDate) {
      const targetDate = calcDate(null, startDate, endDate);

      filterObj.date = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }

    if (
      status === "unviewed" ||
      status === "confirmed" ||
      status === "cancelled"
    ) {
      filterObj.status = status;
    }

    const confirmedCount = await Lesson.countDocuments({
      group: groupId,
      status: "confirmed",
    });
    const cancelledCount = await Lesson.countDocuments({
      group: groupId,
      status: "cancelled",
    });
    const unviewedCount = await Lesson.countDocuments({
      group: groupId,
      status: "unviewed",
    });

    const skip = length || 0;

    const lessons = await Lesson.find(filterObj)
      .skip(skip)
      .limit(limit)
      .sort({ date: 1 })
      .populate("teacher mentor")
      .populate({ path: "students.student", select: "-groups" })
      .populate({
        path: "group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    res.status(200).json({
      lessons,
      confirmedCount,
      cancelledCount,
      unviewedCount,
    });
  } catch (err) {
    console.log(err, "lesson error");
    res.status(500).json({ message: { error: err.message } });
  }
};

// const startDate = new Date("2023-1-1");
// const endDate = new Date("2023-12-31");
// startDate.setHours(16);
// endDate.setHours(16);

// const fakeGroup = {
//   _id: "657d9fdaa26257b6c52e8730",
//   course: "657da00da26257b6c52e873a",
//   students: [
//     { student: "658124cdc2a2bbccf7fd4083" },
//     { student: "65812502c2a2bbccf7fd4089" },
//     { student: "658124e4c2a2bbccf7fd4086" },
//   ],
//   startDate: startDate,
//   endDate: endDate,
//   lessonDate: [
//     {
//       day: 1,
//       time: "11:00",
//     },
//     {
//       day: 2,
//       time: "14:00",
//     },
//     {
//       day: 3,
//       time: "18:00",
//     },
//     {
//       day: 5,
//       time: "20:00",
//     },
//   ],
// };

// createLessons(fakeGroup);

// const lessonDate = [
//   {
//     day: 1,
//   },
//   {
//     day: 2,
//   },
//   {
//     day: 3,
//   },
//   {
//     day: 5,
//   },
// ];

// const startDate = new Date("2023-8-25");
// const endDate = new Date("2023-12-12");

// startDate.setHours(16);
// endDate.setHours(16);

// const dates = [];

// while (startDate <= endDate) {
//   const currentDay = startDate.getDay();
//   const checkDay = lessonDate.find((item) => item.day === currentDay);

//   if (checkDay) {
//     const currentDate = new Date(startDate);

//     dates.push(currentDate);
//   }

//   startDate.setDate(startDate.getDate() + 1);
// }

// Update lesson
export const updateLesson = async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  console.log(updatedData.students);
  try {
    if (date) {
      // const day = new Date(date).getDay();
      const day = moment.tz(date, "Asia/Baku").day();
      updatedData.day = day == 0 ? 7 : day;
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "lessonTable"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;
        const mainLesson = await Lesson.findById(id);
        const mainLessonObj = mainLesson?.toObject();
        const changes = { ...mainLessonObj?.changes };
        delete mainLessonObj.changes;

        const changesObj = { ...mainLessonObj, ...changes, ...updatedData };

        const payload = new Lesson(changesObj);
        await payload.populate("teacher students.student group mentor");

        updatedData = {
          changes: payload.toObject(),
        };
      }
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(id, updatedData, {
      new: true,
    }).populate("teacher students.student group mentor");

    const confirmedCount = await Lesson.countDocuments({
      group: updatedLesson.group._id,
      status: "confirmed",
    });
    const cancelledCount = await Lesson.countDocuments({
      group: updatedLesson.group._id,
      status: "cancelled",
    });
    const unviewedCount = await Lesson.countDocuments({
      group: updatedLesson.group._id,
      status: "unviewed",
    });

    if (!updatedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.status(200).json({
      lesson: updatedLesson,
      confirmedCount,
      cancelledCount,
      unviewedCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedLesson = await Lesson.findByIdAndDelete(id);

    if (!deletedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const groupId = deletedLesson.group;

    const confirmedCount = await Lesson.countDocuments({
      group: groupId,
      status: "confirmed",
    });
    const cancelledCount = await Lesson.countDocuments({
      group: groupId,
      status: "cancelled",
    });
    const unviewedCount = await Lesson.countDocuments({
      group: groupId,
      status: "unviewed",
    });

    res
      .status(200)
      .json({ deletedLesson, confirmedCount, cancelledCount, unviewedCount });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Confirm lesson changes
export const confirmLessonChanges = async (req, res) => {
  const { id } = req.params;
  const { changes } = req.body;

  try {
    const lesson = await Lesson.findByIdAndUpdate(
      id,
      { ...changes, changes: {} },
      { new: true }
    ).populate("teacher students.student group mentor");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.status(200).json(lesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Cancel lesson changes
export const cancelLessonChanges = async (req, res) => {
  const { id } = req.params;

  try {
    const lesson = await Lesson.findByIdAndUpdate(
      id,
      { changes: {} },
      { new: true }
    ).populate("teacher students.student group mentor");

    res.status(200).json(lesson);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
