import { Lesson } from "../models/lessonModel.js";

// Get update button disable status
export const getUpdateButtonStatus = async (req, res) => {
  const currentDate = new Date();
  const startWeek = new Date(
    currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)
  );
  const endWeek = new Date(currentDate.setDate(currentDate.getDate() + 6));

  startWeek.setHours(0, 0, 0, 0);
  endWeek.setHours(23, 59, 59, 999);
  try {
    const currentLessonsCount = await Lesson.countDocuments({
      role: "current",
      date: {
        $gte: startWeek,
        $lte: endWeek,
      },
    });

    console.log(currentLessonsCount);

    const disabled = currentLessonsCount > 0;

    res.status(200).json({ disabled });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
