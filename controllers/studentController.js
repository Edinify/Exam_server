import fs from "fs/promises";
import Docxtemplater from "docxtemplater";
import path from "path";
import PizZip from "pizzip";
import { Lesson } from "../models/lessonModel.js";
import { Student } from "../models/studentModel.js";
import logger from "../config/logger.js";
import { Group } from "../models/groupModel.js";
import { Course } from "../models/courseModel.js";
import { Worker } from "../models/workerModel.js";
import { Teacher } from "../models/teacherModel.js";
import mongoose from "mongoose";
import moment from "moment";
import exceljs from "exceljs";
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel.js";

// Create student
export const createStudent = async (req, res) => {
  const { email, password } = req.body;

  try {
    const regexEmail = new RegExp(email || "", "i");

    const existingAdmin = await Admin.findOne({
      email: { $regex: regexEmail },
    });
    const existingWorker = await Worker.findOne({
      email: { $regex: regexEmail },
    });
    const existingTeacher = await Teacher.findOne({
      email: { $regex: regexEmail },
    });
    const existingStudent = await Student.findOne({
      email: { $regex: regexEmail },
    });

    if (
      email &&
      (existingAdmin || existingWorker || existingTeacher || existingStudent)
    ) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    const salt = await bcrypt.genSalt(10);
    let hashedPassword;

    if (password) {
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newStudent = new Student({ ...req.body, password: hashedPassword });

    await newStudent.save();

    const groupsIds = newStudent.groups.map((item) => item?.group);

    await Group.updateMany(
      { _id: { $in: groupsIds } },
      { $addToSet: { students: newStudent._id } }
    );

    await Lesson.updateMany(
      {
        group: { $in: groupsIds },
      },
      {
        $push: {
          students: {
            student: newStudent._id,
          },
        },
      }
    );

    const student = await Student.findById(newStudent._id).populate({
      path: "groups.group",
      populate: {
        path: "course",
        model: "Course",
      },
    });

    res.status(201).json({ ...student.toObject(), password: "" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students
export const getStudents = async (req, res) => {
  const { studentsCount, searchQuery } = req.query;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const students = await Student.find({
      fullName: { $regex: regexSearchQuery },
    })
      .select("-password")
      .skip(parseInt(studentsCount || 0))
      .limit(parseInt(studentsCount || 0) + 30);

    const totalLength = await Student.countDocuments({
      fullName: { $regex: regexSearchQuery },
    });

    res.status(200).json({ students, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get active students
export const getActiveStudents = async (req, res) => {
  const { studentsCount, searchQuery, courseId } = req.query;
  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const students = await Student.find({
      fullName: { $regex: regexSearchQuery },
      deleted: false,
      courses: { $in: courseId },
    })
      .select("-password")
      .skip(parseInt(studentsCount || 0))
      .limit(parseInt(studentsCount || 0) + 30);

    const totalLength = await Student.countDocuments({
      fullName: { $regex: regexSearchQuery },
      deleted: false,
      courses: { $in: courseId },
    });

    res.status(200).json({ students, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students for pagination
export const getStudentsForPagination = async (req, res) => {
  const { searchQuery, status, courseId, groupId, length, studentGroupStatus } =
    req.query;
  const limit = 20;

  console.log(req.query);
  try {
    let filterObj = { deleted: false };

    if (status === "active") filterObj.status = true;
    if (status === "deactive") filterObj.status = false;
    if (courseId) filterObj.courses = courseId;
    if (groupId) filterObj["groups.group"] = groupId;
    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");
      filterObj.fullName = { $regex: regexSearchQuery };
    }
    if (studentGroupStatus) {
      if (studentGroupStatus === "wait") {
        console.log("wait okay");
        filterObj.groups = { $size: 0 };
      } else {
        filterObj["groups.status"] = studentGroupStatus;
      }
    }

    console.log(filterObj);

    const totalLength = await Student.countDocuments({
      ...filterObj,
    });

    let students = await Student.find({
      ...filterObj,
    })
      .select("-password")
      .skip(length || 0)
      .limit(limit)
      .populate("courses")
      .populate({
        path: "groups.group",
        populate: {
          path: "course",
          model: "Course",
        },
      })
      .sort({ createdAt: -1 });

    students = await Promise.all(
      students.map(async (student) => {
        const practicsLessonCount = Lesson.aggregate([
          { $unwind: "$students" },
          { $match: { "topic.name": "Praktika" } },
          {
            $match: {
              "students.student": new mongoose.Types.ObjectId(student._id),
            },
          },
          { $match: { "students.attendance": -1, status: "confirmed" } },
          { $group: { _id: null, count: { $sum: 1 } } },
        ]);

        const mainLessonCount = Lesson.aggregate([
          { $unwind: "$students" },
          { $match: { "topic.name": { $ne: "Praktika" } } },
          {
            $match: {
              "students.student": new mongoose.Types.ObjectId(student._id),
            },
          },
          { $match: { "students.attendance": -1, status: "confirmed" } },
          { $group: { _id: null, count: { $sum: 1 } } },
        ]);

        const [practics, main] = await Promise.all([
          practicsLessonCount.exec(),
          mainLessonCount.exec(),
        ]);

        return {
          ...student.toObject(),
          practicsQbCount: practics[0]?.count || 0,
          mainQbCount: main[0]?.count || 0,
        };
      })
    );

    res.status(200).json({ students, totalLength });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students by course id
export const getStudentsByCourseId = async (req, res) => {
  const { courseId, day, time, role, date, studentsCount, searchQuery } =
    req.query;
  const targetDate = new Date(date);
  const targetMonth = targetDate.getMonth() + 1;
  const targetYear = targetDate.getFullYear();
  const targetDayOfMonth = targetDate.getDate();

  console.log(req.query);

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const students = await Student.find({
      fullName: { $regex: regexSearchQuery },
      "courses.course": courseId,
      status: true,
      deleted: false,
    })
      .skip(parseInt(studentsCount || 0))
      .limit(parseInt(studentsCount || 0) + 30)
      .select("-password");

    const totalLength = await Student.countDocuments({
      fullName: { $regex: regexSearchQuery },
      "courses.course": courseId,
      status: true,
      deleted: false,
    });

    let checkStudent;

    const newStudents = await Promise.all(
      students.map(async (student) => {
        if (role === "main") {
          checkStudent = await Lesson.find({
            "students.student": student._id,
            day: day,
            time: time,
            role: role,
          });
        } else if (role === "current") {
          checkStudent = await Lesson.find({
            "students.student": student._id,
            day: Number(day),
            time: time,
            role: role,
            status: {
              $in: ["unviewed", "confirmed"],
            },
            $expr: {
              $and: [
                { $eq: [{ $year: "$date" }, targetYear] },
                { $eq: [{ $month: "$date" }, targetMonth] },
                { $eq: [{ $dayOfMonth: "$date" }, targetDayOfMonth] },
              ],
            },
          });
        }

        if (checkStudent.length > 0) {
          return { ...student.toObject(), disable: true };
        } else {
          return { ...student.toObject(), disable: false };
        }
      })
    );

    res.status(200).json({ students: newStudents, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  try {
    const regexEmail = new RegExp(email || "", "i");

    const existingAdmin = await Admin.findOne({
      email: { $regex: regexEmail },
    });
    const existingWorker = await Worker.findOne({
      email: { $regex: regexEmail },
    });
    const existingTeacher = await Teacher.findOne({
      email: { $regex: regexEmail },
      _id: { $ne: id },
    });
    const existingStudent = await Student.findOne({
      email: { $regex: regexEmail },
      _id: { $ne: id },
    });

    if (
      email &&
      (existingTeacher || existingAdmin || existingWorker || existingStudent)
    ) {
      return res.status(409).json({ key: "email-already-exist" });
    }

    if (updatedData.password && updatedData.password.length > 5) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updatedData.password, salt);
      updatedData = { ...updatedData, password: hashedPassword };
    } else {
      delete updatedData.password;
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "students"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;

        const payload = new Student(updatedData);
        await payload.populate("courses groups.group");

        updatedData = { changes: payload.toObject() };

        const updatedStudent = await Student.findByIdAndUpdate(
          id,
          updatedData,
          {
            new: true,
          }
        )
          .populate("courses")
          .populate({
            path: "groups.group",
            populate: {
              path: "course",
              model: "Course",
            },
          });

        return res.status(200).json(updatedStudent);
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, {
      new: true,
    })
      .populate("courses")
      .populate({
        path: "groups.group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    if (!updatedStudent) {
      return res.status(404).json({ key: "student-not-found" });
    }

    const groupsIds = updatedStudent.groups.map((item) => item?.group._id);

    await Group.updateMany(
      {
        _id: { $in: groupsIds },
      },
      { $addToSet: { students: updatedStudent._id } }
    );

    await Group.updateMany(
      {
        _id: { $nin: groupsIds },
        students: { $in: updatedStudent._id },
      },
      { $pull: { students: updatedStudent._id } }
    );

    await Lesson.updateMany(
      {
        group: { $in: groupsIds },
        "students.student": { $ne: updatedStudent._id },
      },
      { $push: { students: { student: updatedStudent._id } } }
    );

    await Lesson.updateMany(
      {
        group: { $nin: groupsIds },
        "students.student": { $in: updatedStudent._id },
      },
      { $pull: { students: { student: updatedStudent._id } } }
    );

    res.status(200).json({ ...updatedStudent.toObject(), password: "" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedStudent = await Student.findByIdAndUpdate(
      id,
      {
        deleted: true,
      },
      { new: true }
    );

    if (!deletedStudent) {
      return res.status(404).json({ key: "student-not-found" });
    }

    res.status(200).json(deletedStudent);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Update student password
export const updateStudentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user;

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      student.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ key: "old-password-incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({ ...updatedStudent.toObject(), password: "" });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Confirm student changes
export const confirmStudentChanges = async (req, res) => {
  const { id } = req.params;
  const { changes } = req.body;

  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { ...changes, changes: {} },
      {
        new: true,
      }
    )
      .populate("courses")
      .populate({
        path: "groups.group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    if (!updatedStudent) {
      return res.status(404).json({ key: "student-not-found" });
    }

    const groupsIds = updatedStudent.groups.map((item) => item?.group._id);

    await Group.updateMany(
      {
        _id: { $in: groupsIds },
      },
      { $addToSet: { students: updatedStudent._id } }
    );

    await Group.updateMany(
      {
        _id: { $nin: groupsIds },
        students: { $in: updatedStudent._id },
      },
      { $pull: { students: updatedStudent._id } }
    );

    await Lesson.updateMany(
      {
        group: { $in: groupsIds },
        "students.student": { $ne: updatedStudent._id },
      },
      { $push: { students: { student: updatedStudent._id } } }
    );

    await Lesson.updateMany(
      {
        group: { $nin: groupsIds },
        "students.student": { $in: updatedStudent._id },
      },
      { $pull: { students: { student: updatedStudent._id } } }
    );

    res.status(200).json(updatedStudent);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Cancel teacher changes
export const cancelStudentChanges = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findByIdAndUpdate(
      id,
      { changes: {} },
      { new: true }
    )
      .populate("courses")
      .populate({
        path: "groups.group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    res.status(200).json(student);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Export word file
export const exportStudentContract = async (req, res) => {
  const { studentId, groupId } = req.query;

  try {
    const student = await Student.findById(studentId).populate({
      path: "groups.group",
      populate: {
        path: "course",
        model: "Course",
      },
    });
    const group = student.groups.find(
      (item) => item.group._id.toString() === groupId
    );
    const date = new Date();
    const currentYear = date.getFullYear();
    const payments = group?.payments?.map((item) => ({
      payment: item.payment,
      paymentDate: item?.paymentDate
        ? moment(item.paymentDate).locale("az").format("DD.MM.YYYY")
        : "--",
    }));

    const data = {
      studentName: student?.fullName || "--",
      contractDate: group?.contractStartDate
        ? moment(group.contractStartDate).locale("az").format("DD.MM.YYYY")
        : "--",
      contractDateSecond: group?.contractStartDate
        ? moment(group.contractStartDate)
            .locale("az")
            .format(`"DD" MMMM YYYY[-ci il]`)
        : "--",
      fin: student?.fin || "--",
      seria: student?.seria || "--",
      course: group?.group?.course?.name || "--",
      totalAmount: group?.totalAmount || "--",
      monthlyPayment: group?.payments[0]?.payment || "--",
      paymentType: group?.payment?.paymentType || "--",
      discount: group?.discount || "--",
      phoneNumber: student?.phone || "--",
      contractId: group?.contractId
        ? `${group?.contractId}/${currentYear}`
        : "--",
      lessonCount: group?.group?.course?.lessonCount || "--",
      payments: payments,
    };

    console.log(data);

    const content = await fs.readFile(
      path.resolve(process.cwd(), "templates", "student.docx"),
      "binary"
    );

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Write the output document to a file
    await fs.writeFile(
      path.resolve(process.cwd(), "exports", "exported_document.docx"),
      buffer
    );

    res.download(
      path.resolve(process.cwd(), "exports", "exported_document.docx"),
      "exported_document.docx"
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const exportStudentContractSecond = async (req, res) => {
  const { studentId, groupId } = req.query;

  try {
    const student = await Student.findById(studentId).populate({
      path: "groups.group",
      populate: {
        path: "course",
        model: "Course",
      },
    });
    const group = student.groups.find(
      (item) => item.group._id.toString() === groupId
    );
    const date = new Date();
    const currentYear = date.getFullYear();
    const payments = group?.payments?.map((item) => ({
      payment: item.payment,
      paymentDate: item?.paymentDate
        ? moment(item.paymentDate).locale("az").format("DD.MM.YYYY")
        : "--",
    }));

    const data = {
      studentName: student?.fullName || "--",
      contractDate: group?.contractStartDate
        ? moment(group.contractStartDate).locale("az").format("DD.MM.YYYY")
        : "--",
      contractDateSecond: group?.contractStartDate
        ? moment(group.contractStartDate)
            .locale("az")
            .format(`"DD" MMMM YYYY[-ci il]`)
        : "--",
      fin: student?.fin || "--",
      seria: student?.seria || "--",
      course: group?.group?.course?.name || "--",
      totalAmount: group?.totalAmount || "--",
      monthlyPayment: group?.payments[0]?.payment || "--",
      paymentType: group?.payment?.paymentType || "--",
      discount: group?.discount || "--",
      phoneNumber: student?.phone || "--",
      contractId: group?.contractId
        ? `${group?.contractId}/${currentYear}`
        : "--",
      lessonCount: group?.group?.course?.lessonCount || "--",
      payments: payments,
    };

    console.log(data);

    const content = await fs.readFile(
      path.resolve(process.cwd(), "templates", "student.docx"),
      "binary"
    );

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Write the output document to a file
    await fs.writeFile(
      path.resolve(process.cwd(), "exports", "exported_document.docx"),
      buffer
    );

    res.download(
      path.resolve(process.cwd(), "exports", "exported_document.docx"),
      "exported_document.docx"
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Export excel file
export const exportStudentsExcel = async (req, res) => {
  const whereComingList = [
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
  ];
  const whereSendList = [
    { name: "Technest İnside", key: "technestInside" },
    { name: "Dövlət Məşğulluq Agentliyi", key: "DMA" },
    { name: "Azərbaycan Respublikası Mədəniyyət Nazirliyi", key: "ARMN" },
    { name: "Təhsilin İnkişafı Fondu", key: "TIF" },
    { name: "Azərbaycan Respublikası Elm və Təhsil Nazirliyi", key: "ARETN" },
    { name: "Technest university", key: "technestUniversity" },
    { name: "Future leaders", key: "futureLeaders" },
    { name: "Code for Future", key: "codeForFuture" },
    { name: "Digər", key: "other" },
  ];

  const headerStyle = {
    font: { bold: true },
  };

  try {
    const students = await Student.find({ deleted: false })
      .populate("courses groups.group")
      .sort({ createdAt: -1 });

    const workbook = new exceljs.Workbook();

    const sheet = workbook.addWorksheet("students");

    sheet.columns = [
      { header: "Tələbə adı	", key: "fullName", width: 30 },
      { header: "Fin kod", key: "fin", width: 15 },
      { header: "Seria nömrəsi", key: "seria", width: 15 },
      { header: "Doğum tarixi", key: "birthday", width: 15 },
      { header: "Telefon nömrəsi", key: "phone", width: 20 },
      { header: "İxtisaslar", key: "courses", width: 20 },
      { header: "Qruplar", key: "groups", width: 20 },
      { header: "Bizi haradan eşidiblər", key: "whereComing", width: 30 },
      { header: "Haradan göndərilib", key: "whereSend", width: 30 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
    });

    students.forEach((student) => {
      sheet.addRow({
        fullName: student?.fullName || "",
        fin: student?.fin || "",
        seria: student?.seria || "",
        birthday: student?.birthday
          ? moment(student.birthday).format("DD.MM.YYYY")
          : "",
        phone: student?.phone || "",
        courses:
          student?.courses?.map((course) => course.name).join(", ") || "",
        groups:
          student?.groups?.map((item) => item.group.name).join(", ") || "",
        whereComing:
          whereComingList.find((item) => item.key === student?.whereComing)
            ?.name || "",
        whereSend:
          whereSendList.find((item) => item.key === student?.whereSend)?.name ||
          "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");
    workbook.xlsx.write(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
