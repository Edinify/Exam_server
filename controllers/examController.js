import { Exam } from "../models/examModel.js";
import { Question } from "../models/questionModel.js";

// GET
export const getExams = async (req, res) => {
  const { searchQuery, length, type } = req.query;
  const { id, role } = req.user;
  const limit = 20;

  try {
    const filterObj = {};

    if (role === "teacher") filterObj.teacher = id;

    if (role === "student") filterObj.students = id;

    if (type) {
      const currentDate = new Date();

      filterObj.date =
        type === "notHeld"
          ? {
              $gt: currentDate,
            }
          : {
              $lt: currentDate,
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
      .populate("teacher students course");

    res.status(200).json({ exams, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getQuestions = async (req, res) => {
  const { examId } = req.query;
  const { role, id } = req.user;

  console.log(req.user, "current user");
  try {
    let questions = await Question.find({ exam: examId });

    if (role === "student") {
      questions = questions.map((question) => ({
        ...question.toObject(),
        studentAnswer:
          question.answers.find((item) => item.student.toString() === id) || "",
      }));
    }

    console.log(questions);
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getExamResults = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await Exam.findById(id).populate("students");

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    const questions = await Question.find({ exam: id });

    const results = exam.students.map((student) => {
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      // 4. Hər bir sual üzrə tələbənin cavabını yoxla
      questions.forEach((question) => {
        const studentAnswer = question.answers.find(
          (answer) => answer.student.toString() === student._id.toString()
        );

        if (studentAnswer) {
          if (studentAnswer.isCorrect) {
            correctCount += 1;
          } else {
            incorrectCount += 1;
          }
        } else {
          unansweredCount += 1;
        }
      });

      return {
        student: student,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unansweredQuestions: unansweredCount,
      };
    });

    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// CREATE
export const createExam = async (req, res) => {
  try {
    const newExam = new Exam(req.body);
    await newExam.save();

    res.status(201).json(newExam);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();

    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

// UPDATE
export const updateExam = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedExam = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json(updatedExam);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const updateQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
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
