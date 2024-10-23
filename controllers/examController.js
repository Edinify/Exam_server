import { Exam } from "../models/examModel.js";
import { Question } from "../models/questionModel.js";
import moment from "moment-timezone";

// GET
export const getExams = async (req, res) => {
  const { searchQuery, length, type } = req.query;
  const { id, role } = req.user;
  const limit = 20;

  try {
    const currentDate = new Date();
    const filterObj = {};

    if (role === "teacher") filterObj.teacher = id;

    if (role === "student") filterObj.students = id;

    if (type && role === "super-admin") {
      filterObj.startDate =
        type === "notHeld"
          ? {
              $gt: currentDate,
            }
          : {
              $lte: currentDate,
            };
    }

    if (role === "student") {
      filterObj.endDate = {
        $gt: currentDate,
      };
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      filterObj.name = { $regex: regexSearchQuery };
    }

    const totalLength = await Exam.countDocuments(filterObj);

    const exams = await Exam.find(filterObj)
      .skip(length || 0)
      .limit(limit)
      .populate("students");

    let result = exams.map((exam) => ({
      ...exam.toObject(),
      date: exam.startDate,
      active: true,
    }));

    if (role === "student") {
      result = result.map((item) => ({
        ...item,
        active: currentDate >= item.startDate && currentDate <= item.endDate,
      }));
    }

    res.status(200).json({ exams: result, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getQuestions = async (req, res) => {
  const { examId } = req.query;
  const { role, id } = req.user;

  console.log(req.user, "current user");
  try {
    const currentExam = await Exam.findById(examId);
    let questions = await Question.find({ exam: examId, role: "main" });

    if (role === "student") {
      questions = await Question.find({ exam: examId, studentId: id });
    }

    res.status(200).json({ currentExam, questions });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getExamResultsByStudent = async (req, res) => {
  const { id } = req.user;

  try {
    const currentDate = new Date();
    const exams = await Exam.find({
      students: id,
      endDate: { $lt: currentDate },
    });

    const results = await Promise.all(
      exams.map(async (exam) => {
        let correctCount = await Question.countDocuments({
          studentId: id,
          exam: exam._id,
          options: {
            $elemMatch: {
              isCorrect: true,
              isCorrectByStudent: true,
            },
          },
        });

        return {
          examName: exam.name,
          correctCount,
        };
      })
    );

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getExamResultsByExam = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id).populate("students");

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const results = await Promise.all(
      exam.students.map(async (student) => {
        let correctCount = await Question.countDocuments({
          exam: exam._id,
          studentId: student._id,
          options: {
            $elemMatch: {
              isCorrect: true,
              isCorrectByStudent: true,
            },
          },
        });

        let questionsCount = await Question.countDocuments({
          exam: exam._id,
          studentId: student._id,
        });

        return {
          studentName: student.fullName,
          questionsCount,
          correctCount,
        };
      })
    );

    res.status(200).json({ currentExam: exam, results });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// CREATE
export const createExam = async (req, res) => {
  try {
    const { name, date, startTime, endTime, students } = req.body;
    const timeZone = "Asia/Baku";

    console.log(req.body);
    // Start və End tarixləri üçün saatları əlavə edirik
    const fullStartDate = moment
      .tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", timeZone)
      .toDate();

    const fullEndDate = moment
      .tz(`${date} ${endTime}`, "YYYY-MM-DD HH:mm", timeZone)
      .toDate();

    fullStartDate.setDate(fullStartDate.getDate() + 1);
    fullEndDate.setDate(fullEndDate.getDate() + 1);

    const newExam = new Exam({
      name,
      startDate: fullStartDate,
      endDate: fullEndDate,
      startTime,
      endTime,
      students,
    });

    await newExam.save();
    await newExam.populate("students");
    console.log(newExam);
    res
      .status(201)
      .json({ ...newExam.toObject(), date: newExam.startDate, active: true });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const createQuestion = async (req, res) => {
  console.log(req.body);
  try {
    const newQuestion = new Question({ ...req.body, role: "main" });
    await newQuestion.save();

    const exam = await Exam.findById(newQuestion.exam);

    const questionsForStudents = exam.students.map((studentId) => ({
      exam: exam._id,
      text: newQuestion.text,
      options: newQuestion.options,
      studentId: studentId,
      role: "current",
    }));

    await Question.insertMany(questionsForStudents);

    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

// UPDATE
export const updateExam = async (req, res) => {
  const { id } = req.params;
  const { name, students } = req.body;
  try {
    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { name, students },
      {
        new: true,
      }
    ).populate("students");

    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res
      .status(200)
      .json({ ...updatedExam.toObject(), date: updatedExam.startDate });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  try {
    const updatedQuestion = await Question.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (role === "super-admin") {
      await Question.updateMany(
        { exam: updatedQuestion.exam, role: "current" },
        { text: updatedQuestion.text, options: updatedQuestion.options }
      );
    }

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const updateQuestionByStudent = async (req, res) => {
  const { id } = req.params;
  const { studentAnswer } = req.body;

  try {
    const updatedQuestion = await Question.findById(id);

    // const targetAnswer = updatedQuestion.answers.find(
    //   (item) => item.student.toObject() === studentAnswer.student
    // );

    // if (targetAnswer && targetAnswer.answer === studentAnswer.answer) {
    //   const filteredAnswers = updatedQuestion.answers.filter(
    //     (item) => item.student.toString() !== targetAnswer.student.toString()
    //   );
    //   updatedQuestion.answers = filteredAnswers;
    // }else(targetAnswer) {
    //   const
    // }

    updatedQuestion.answers.push(studentAnswer);

    updatedQuestion.save();

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      ...updatedQuestion.toObject(),
      studentAnswer: updatedQuestion.answers.find(
        (item) => item.student.toObject() === req.user.id
      ),
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

// Delete
export const deleteExam = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedExam = await Exam.findByIdAndDelete(id);

    if (!deletedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    await Question.deleteMany({ exam: deletedExam._id });

    res.status(200).json(deletedExam);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};
export const deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json(deletedQuestion);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};
