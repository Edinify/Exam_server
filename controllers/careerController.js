import { Student } from "../models/studentModel.js";
import { v4 as uuidv4 } from "uuid";
import exceljs from "exceljs";
import moment from "moment";
import mongoose from "mongoose";

// Get careers

export const getCareers = async (req, res) => {
  const { searchQuery, courseId, groupId, length, studentGroupStatus } =
    req.query;
  const limit = 20;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const pipeline = [
      {
        $match: {
          fullName: { $regex: regexSearchQuery },
          "groups.0": { $exists: true },
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $lookup: {
          from: "groups",
          localField: "groups.group",
          foreignField: "_id",
          as: "groups.group",
        },
      },
      {
        $unwind: "$groups.group",
      },
      {
        $lookup: {
          from: "courses",
          localField: "groups.group.course",
          foreignField: "_id",
          as: "groups.group.course",
        },
      },
      {
        $unwind: "$groups.group.course",
      },
    ];

    if (courseId) {
      pipeline.push({
        $match: {
          "groups.group.course._id": new mongoose.Types.ObjectId(courseId),
        },
      });
    }

    if (groupId) {
      pipeline.push({
        $match: {
          "groups.group._id": new mongoose.Types.ObjectId(groupId),
        },
      });
    }

    if (studentGroupStatus) {
      pipeline.push({
        $match: {
          "groups.status": studentGroupStatus,
        },
      });
    }

    pipeline.push(
      {
        $skip: parseInt(length) || 0,
      },
      {
        $limit: limit,
      },
      {
        $addFields: {
          _id: {
            $concat: [
              { $toString: "$groups.group._id" },
              "-",
              { $toString: "$_id" },
            ],
          },
          studentId: "$_id",
          group: "$groups.group",
          contractStartDate: "$groups.contractStartDate",
          contractEndDate: "$groups.contractEndDate",
          part: "$groups.part",
          amount: "$groups.amount",
          totalAmount: "$groups.totalAmount",
          discountReason: "$groups.discountReason",
          discount: "$groups.discount",
          cvLink: "$groups.cvLink",
          portfolioLink: "$groups.portfolioLink",
          workStatus: "$groups.workStatus",
          previousWorkPlace: "$groups.previousWorkPlace",
          previousWorkPosition: "$groups.previousWorkPosition",
          currentWorkPlace: "$groups.currentWorkPlace",
          currentWorkPosition: "$groups.currentWorkPosition",
          workStartDate: "$groups.workStartDate",
          diplomaStatus: "$groups.diplomaStatus",
          diplomaDegree: "$groups.diplomaDegree",
          diplomaDate: "$groups.diplomaDate",
          payments: "$groups.payments",
          paids: "$groups.paids",
          status: "$groups.status",
          degree: "$groups.degree",
        },
      },
      {
        $project: {
          groups: 0,
        },
      }
    );

    const students = await Student.aggregate(pipeline);

    console.log(students[0]);
    res.status(200).json({
      careers: students,
      currentLength: +length + students.length,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateCareer = async (req, res) => {
  const {
    studentId,
    group,
    portfolioLink,
    cvLink,
    currentWorkPlace,
    currentWorkPosition,
    previousWorkPlace,
    previousWorkPosition,
    workStartDate,
    workStatus,
  } = req.body;

  console.log(req.body, "career body");

  try {
    const student = await Student.findById(studentId);

    if (!student?.groups || student.groups.length === 0) {
      return res.status(200).json();
    }

    const targetStudentGroup = student.groups.find(
      (item) => item.group.toString() === group._id.toString()
    );

    if (!targetStudentGroup) {
      return res.status(200).json();
    }

    targetStudentGroup.portfolioLink = portfolioLink;
    targetStudentGroup.cvLink = cvLink;
    targetStudentGroup.currentWorkPlace = currentWorkPlace;
    targetStudentGroup.currentWorkPosition = currentWorkPosition;
    targetStudentGroup.previousWorkPlace = previousWorkPlace;
    targetStudentGroup.previousWorkPosition = previousWorkPosition;
    targetStudentGroup.workStartDate = workStartDate;
    targetStudentGroup.workStatus = workStatus;

    await student.save();

    const targetGroup = student.groups.find(
      (item) => item.group.toString() === group._id.toString()
    );

    res.status(200).json({
      ...req.body,
      portfolioLink: targetGroup.portfolioLink,
      cvLink: targetGroup.cvLink,
      currentWorkPlace: targetGroup.currentWorkPlace,
      currentWorkPosition: targetGroup.currentWorkPosition,
      previousWorkPlace: targetGroup.previousWorkPlace,
      previousWorkPosition: targetGroup.previousWorkPosition,
      workStartDate: targetGroup.workStartDate,
      workStatus: targetGroup.workStatus,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Export excel file
export const exportCareersExcel = async (req, res) => {
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

  const careerModalWorkStatusList = [
    { name: "İşləyir", key: "employed" },
    { name: "Tələbədir", key: "student" },
    { name: "İşsizdir", key: "unemployed" },
  ];

  const headerStyle = {
    font: { bold: true },
  };

  try {
    const students = await Student.find({
      "groups.0": { $exists: true },
    }).populate({
      path: "groups.group",
      populate: {
        path: "course",
        module: "Course",
      },
    });

    const careers = students.reduce((list, student) => {
      const career = student.groups.map((item) => ({
        ...student.toObject(),
        groups: null,
        ...item.toObject(),
        studentId: student._id,
        _id: uuidv4(),
      }));

      return [...list, ...career];
    }, []);

    const workbook = new exceljs.Workbook();

    const sheet = workbook.addWorksheet("career");

    sheet.columns = [
      { header: "Tələbə adı	", key: "fullName", width: 30 },
      { header: "Fin kod", key: "fin", width: 15 },
      { header: "Seria nömrəsi", key: "seria", width: 15 },
      { header: "Doğum tarixi", key: "birthday", width: 15 },
      { header: "Telefon nömrəsi", key: "phone", width: 20 },
      { header: "Qrup", key: "group", width: 20 },
      { header: "İxtisas", key: "course", width: 20 },
      { header: "CV link", key: "cvLink", width: 30 },
      { header: "Portfolio link", key: "portfolioLink", width: 30 },
      { header: "Dərsə başlama tarixi", key: "contractStartDate", width: 21 },
      { header: "Dərsi bitirmə tarixi", key: "contractEndDate", width: 21 },
      { header: "Bizi haradan eşidiblər", key: "whereComing", width: 25 },
      { header: "Haradan göndərilib", key: "whereSend", width: 35 },
      { header: "Əvvəlki iş yeri", key: "previousWorkPlace", width: 30 },
      { header: "Əvvəlki iş vəzifəsi", key: "previousWorkPosition", width: 30 },
      { header: "	Cari iş yeri", key: "currentWorkPlace", width: 30 },
      { header: "Cari iş vəzifəsi", key: "currentWorkPosition", width: 30 },
      { header: "İşə başlama tarixi", key: "workStartDate", width: 21 },
      { header: "İş Statusu", key: "workStatus", width: 15 },
      { header: "Status", key: "status", width: 20 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
    });

    careers.forEach((item) => {
      sheet.addRow({
        fullName: item?.fullName ? item.fullName : "",
        fin: item?.fin || "",
        seria: item?.seria || "",
        birthday: item?.birthday
          ? moment(item.birthday).format("DD.MM.YYYY")
          : "",
        phone: item?.phone || "",
        group: item?.group?.name || "",
        course: item?.group?.course?.name || "",
        cvLink: item?.cvLink || "",
        portfolioLink: item?.portfolioLink || "",
        contractStartDate: item?.contractStartDate
          ? moment(item.contractStartDate).format("DD.MM.YYYY")
          : "",
        contractEndDate: item?.contractEndDate
          ? moment(item.contractEndDate).format("DD.MM.YYYY")
          : "",
        whereComing:
          whereComingList.find((listItem) => listItem.key === item?.whereComing)
            ?.name || "",
        whereSend:
          whereSendList.find((listItem) => listItem.key === item?.whereSend)
            ?.name || "",
        previousWorkPlace: item?.previousWorkPlace || "",
        previousWorkPosition: item?.previousWorkPosition || "",
        currentWorkPlace: item?.currentWorkPlace || "",
        currentWorkPosition: item?.currentWorkPosition || "",
        workStartDate: item?.workStartDate || "",
        workStatus: item?.workStatus?.map((item) => item.name)?.join(", "),
        status: item?.status ? "Davam edir" : "Məzun",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=career.xlsx");
    workbook.xlsx.write(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
