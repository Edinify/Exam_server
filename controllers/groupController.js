import { Group } from "../models/groupModel.js";
import { createLessons } from "./lessonController.js";
import { Student } from "../models/studentModel.js";
import { Lesson } from "../models/lessonModel.js";
import { Worker } from "../models/workerModel.js";
import { Room } from "../models/roomModel.js";
import moment from "moment";

// Get groups
export const getGroups = async (req, res) => {
  const { status, courseId } = req.query;

  try {
    const filterObj = {};

    if (status === "current" || status === "ended" || status === "waiting")
      filterObj.status = status;

    if (courseId) filterObj.course = courseId;

    const groups = await Group.find(filterObj).populate("teachers mentors");

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get groups with course id
export const getGroupsWithCourseId = async (req, res) => {
  const { groupsCount, searchQuery, courseIds } = req.query;
  const currentDate = new Date();

  console.log(req.query);
  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const groups = await Group.find({
      name: { $regex: regexSearchQuery },
      course: { $in: courseIds },
      // endDate: {
      //   $gte: currentDate,
      // },
    })
      .skip(parseInt(groupsCount || 0))
      .limit(parseInt(groupsCount || 0) + 30)
      .populate("teachers students course");

    const totalLength = await Group.countDocuments({
      name: { $regex: regexSearchQuery },
      course: { $in: courseIds },
      endDate: {
        $gte: currentDate,
      },
    });

    res.status(200).json({ groups, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get groups with teacher id
export const getGroupsWithTeacherId = async (req, res) => {
  const { searchQuery, teacherId } = req.query;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const groups = await Group.find({
      name: { $regex: regexSearchQuery },
      teachers: { $in: teacherId },
    }).populate("teachers mentors");

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get groups with mentor id
export const getGroupsWithMentorId = async (req, res) => {
  const { searchQuery, mentorId } = req.query;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const groups = await Group.find({
      name: { $regex: regexSearchQuery },
      mentors: { $in: mentorId },
    }).populate("teachers mentors");

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get groups with student id
export const getGroupsWithStudentId = async (req, res) => {
  const { searchQuery, studentId } = req.query;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");

    const groups = await Group.find({
      name: { $regex: regexSearchQuery },
      students: { $in: studentId },
    }).populate("teachers mentors");

    console.log(groups, "ddddddddddddddddddddddddddddddd");
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get groups for pagination
export const getGroupsForPagination = async (req, res) => {
  const { length, searchQuery, status, courseId, teacherId, mentorId } =
    req.query;
  const limit = 20;

  try {
    let totalLength;
    let groupData;
    const filterObj = { status };

    if (courseId) filterObj.course = courseId;

    if (teacherId) filterObj.teachers = teacherId;

    if (mentorId) filterObj.mentors = mentorId;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const groupsCount = await Group.countDocuments({
        name: { $regex: regexSearchQuery },
        ...filterObj,
      });

      groupData = await Group.find({
        name: { $regex: regexSearchQuery },
        ...filterObj,
      })
        .skip(length || 0)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("teachers students course mentors room");

      totalLength = groupsCount;
    } else {
      const groupsCount = await Group.countDocuments(filterObj);
      totalLength = groupsCount;
      groupData = await Group.find(filterObj)
        .skip(length || 0)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("teachers students course mentors room");
    }

    res.status(200).json({ groupData, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create group

const checkIsRoomFull = (targetRoom, lessonDate) => {
  let isRoomFull = false;

  for (const lessonTimeItem of lessonDate || []) {
    if (!targetRoom.groups?.length) break;
    if (
      !lessonTimeItem.day ||
      !lessonTimeItem.startTime ||
      !lessonTimeItem.endTime
    )
      continue;

    for (const groupItem of targetRoom.groups) {
      for (const timeItem of groupItem?.group?.lessonDate || []) {
        const createdGroupLessonStartTime = moment(
          lessonTimeItem.startTime,
          "HH:mm"
        );
        const createdGroupLessonEndTime = moment(
          lessonTimeItem.endTime,
          "HH:mm"
        );
        const inRoomLessonStartTime = moment(timeItem.startTime, "HH:mm");
        const inRoomLessonEndTime = moment(timeItem.endTime, "HH:mm");

        console.log(createdGroupLessonStartTime, "createdGroupLessonStartTime");

        isRoomFull =
          lessonTimeItem.day == timeItem.day &&
          ((createdGroupLessonStartTime.isBefore(inRoomLessonEndTime) &&
            createdGroupLessonStartTime.isAfter(inRoomLessonStartTime)) ||
            (createdGroupLessonEndTime.isBefore(inRoomLessonEndTime) &&
              createdGroupLessonEndTime.isAfter(inRoomLessonStartTime)) ||
            (createdGroupLessonStartTime.isBefore(inRoomLessonStartTime) &&
              createdGroupLessonEndTime.isAfter(inRoomLessonEndTime)) ||
            createdGroupLessonStartTime.isSame(inRoomLessonStartTime) ||
            createdGroupLessonEndTime.isSame(inRoomLessonEndTime));

        if (isRoomFull) return isRoomFull;
      }
    }
  }

  return isRoomFull;
};

export const createGroup = async (req, res) => {
  const { name, status, course, room, lessonDate } = req.body;

  try {
    const regexName = new RegExp(name || "", "i");

    const existingGroup = await Group.findOne({
      name: { $regex: regexName },
    });

    if (name && existingGroup) {
      console.log(existingGroup, "existing group");
      return res.status(409).json({ key: "group-already-exists" });
    }

    const waitingGroup = await Group.findOne({
      course: course,
      status: "waiting",
    });

    if (waitingGroup) {
      console.log("waiting-group-exists");
      return res.status(400).json({ key: "waiting-group-exists" });
    }

    let targetRoom;
    if (room) {
      targetRoom = await Room.findById(room).populate("groups.group");

      if (!targetRoom) {
        return res.status(400).json({ key: "room-required" });
      }

      let isRoomFull =
        status !== "ended" ? checkIsRoomFull(targetRoom, lessonDate) : false;

      if (isRoomFull) {
        return res
          .status(400)
          .json({ key: "room-full", message: "room is full at that time" });
      }
    }

    const newGroup = new Group(req.body);

    await newGroup.populate("teachers students course mentors room");
    await newGroup.save();

    if (status !== "ended" && targetRoom) {
      targetRoom.groups.push({ group: newGroup._id });
      await targetRoom.save();
    }

    const checkResult = await createLessons(newGroup);

    if (!checkResult) {
      return res.status(400).json({
        key: "error-create-lessons",
        message: "An error occurred while creating classes",
      });
    }

    const studentsStatus = status === "ended" ? "graduate" : "continue";

    await Student.updateMany(
      { _id: { $in: newGroup.students } },
      { $push: { groups: { group: newGroup._id, status: studentsStatus } } }
    );

    res.status(201).json(newGroup);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// Update group
export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name, status, course, room, lessonDate } = req.body;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  try {
    const regexName = new RegExp(name || "", "i");

    const existingGroup = await Group.findOne({
      name: { $regex: regexName },
      _id: { $ne: id },
    });

    if (name && existingGroup) {
      console.log(existingGroup);
      return res.status(409).json({ key: "group-already-exists" });
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "groups"
      )?.power;

      console.log(power);

      if (power === "update") {
        delete updatedData.changes;

        const payload = new Group(updatedData);
        await payload.populate("teachers students course mentors");

        updatedData = { changes: payload.toObject() };

        const updatedGroup = await Group.findByIdAndUpdate(id, updatedData, {
          new: true,
        }).populate("teachers students course mentors");

        console.log(updatedGroup, "updated group");

        return res.status(200).json(updatedGroup);
      }
    }

    const oldGroup = await Group.findById(id);

    if (oldGroup.status !== status && status === "waiting") {
      const waitingGroup = await Group.findOne({
        _id: { $ne: oldGroup._id },
        course,
      });

      if (waitingGroup)
        return res.status(400).json({ key: "waiting-group-exists" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(id, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    }).populate("teachers students course mentors room");

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // rooms process start
    if (oldGroup?.room) {
      const oldRoom = await Room.findById(oldGroup.room);

      if (
        (oldGroup.status !== updatedGroup.status &&
          updatedGroup.status === "ended") ||
        oldGroup.room.toString() !== updatedGroup.room._id.toString()
      ) {
        await Room.findByIdAndUpdate(oldGroup.room, {
          $pull: { groups: { group: oldGroup._id } },
        });
      }

      const targetRoom = await Room.findById(updatedGroup.room._id).populate(
        "groups.group"
      );

      if (!targetRoom) {
        return res.status(400).json({ key: "room-required" });
      }

      targetRoom.groups = targetRoom.groups.filter(
        (item) => item.group._id.toString() !== updatedGroup._id.toString()
      );

      let isRoomFull =
        status !== "ended" ? checkIsRoomFull(targetRoom, lessonDate) : false;

      if (isRoomFull) {
        await Group.findByIdAndUpdate(oldGroup._id, oldGroup);
        await Room.findByIdAndUpdate(oldGroup.room, oldRoom);
        return res
          .status(400)
          .json({ key: "room-full", message: "room is full at that time" });
      }

      if (
        status !== "ended" &&
        oldGroup?.room?.toString() !== updatedGroup.room._id.toString()
      ) {
        targetRoom.groups.push({ group: updatedGroup._id });
        await targetRoom.save();
      }

      if (oldGroup.status === "ended" && updatedData.status !== "ended") {
        targetRoom.groups.push({ group: updatedGroup._id });
        await targetRoom.save();
      }
    }

    // rooms process end

    const studentsIds = updatedGroup.students.map((student) => student._id);

    await Student.updateMany(
      {
        _id: { $in: studentsIds },
        "groups.group": { $ne: updatedGroup._id },
      },
      { $push: { groups: { group: updatedGroup._id } } }
    );

    await Student.updateMany(
      {
        _id: { $nin: studentsIds },
        "groups.group": updatedGroup._id,
      },
      { $pull: { groups: { group: updatedGroup._id } } }
    );

    if (oldGroup.status !== updatedGroup.status) {
      const studentsStatus = status === "ended" ? "graduate" : "continue";
      const targetStudents = await Student.find({
        _id: { $in: studentsIds },
      });

      for (let student of targetStudents) {
        const targetGroupItem = student.groups.find(
          (item) => item.group.toString() === updatedGroup._id.toString()
        );

        if (
          targetGroupItem &&
          targetGroupItem.status !== "stopped" &&
          targetGroupItem.status !== "freeze"
        ) {
          targetGroupItem.status = studentsStatus;
          await student.save();
        }
      }
    }

    const addedStudentsIds = studentsIds.reduce(
      (students, id) =>
        !oldGroup.students.find((item) => item.toString() == id.toString())
          ? [...students, { student: id }]
          : students,
      []
    );

    const removedStudentsIds = oldGroup.students.reduce(
      (students, id) =>
        !studentsIds.find((item) => item.toString() == id.toString())
          ? [...students, id]
          : students,
      []
    );

    if (updatedGroup.teachers.length > 0) {
      await Lesson.updateMany(
        {
          group: updatedGroup._id,
          teacher: { $exists: false },
        },
        { teacher: updatedGroup.teachers[0]._id }
      );
    }

    if (updatedGroup.mentors.length > 0) {
      await Lesson.updateMany(
        {
          group: updatedGroup._id,
          mentor: { $exists: false },
        },
        { mentor: updatedGroup.mentors[0]._id }
      );
    }

    await Lesson.updateMany(
      { group: updatedGroup._id },
      { $push: { students: { $each: addedStudentsIds } } }
    );

    await Lesson.updateMany(
      { group: updatedGroup._id },
      { $pull: { students: { student: { $in: removedStudentsIds } } } }
    );

    const newGroup = await Group.findById(updatedGroup._id);

    createLessons(newGroup);

    res.status(200).json(updatedGroup);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedGroup = await Group.findByIdAndDelete(id);

    if (!deletedGroup) {
      return res.status(404).json({ message: "group not found" });
    }

    await Lesson.deleteMany({
      group: deletedGroup._id,
    });

    await Student.updateMany(
      { _id: { $in: deletedGroup.students } },
      { $pull: { groups: { group: deletedGroup._id } } }
    );

    await Room.findByIdAndUpdate(deletedGroup.room, {
      $pull: { groups: { group: deletedGroup._id } },
    });

    res.status(200).json(deletedGroup);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Confirm group changes
export const confirmGroupChanges = async (req, res) => {
  const { id } = req.params;
  const { changes } = req.body;

  try {
    const oldGroup = await Group.findById(id);

    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      { ...changes, changes: {} },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).populate("teachers students course mentors");

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    const studentsIds = updatedGroup.students.map((student) => student._id);

    await Student.updateMany(
      {
        _id: { $in: studentsIds },
        "groups.group": { $ne: updatedGroup._id },
      },
      { $push: { groups: { group: updatedGroup._id } } }
    );

    await Student.updateMany(
      {
        _id: { $nin: studentsIds },
        "groups.group": updatedGroup._id,
      },
      { $pull: { groups: { group: updatedGroup._id } } }
    );

    const addedStudentsIds = studentsIds.reduce(
      (students, id) =>
        !oldGroup.students.find((item) => item.toString() == id.toString())
          ? [...students, { student: id }]
          : students,
      []
    );

    const removedStudentsIds = oldGroup.students.reduce(
      (students, id) =>
        !studentsIds.find((item) => item.toString() == id.toString())
          ? [...students, id]
          : students,
      []
    );

    if (updatedGroup.teachers.length > 0) {
      await Lesson.updateMany(
        {
          group: updatedGroup._id,
          teacher: { $exists: false },
        },
        { teacher: updatedGroup.teachers[0]._id }
      );
    }

    if (updatedGroup.mentors.length > 0) {
      await Lesson.updateMany(
        {
          group: updatedGroup._id,
          mentor: { $exists: false },
        },
        { mentor: updatedGroup.mentors[0]._id }
      );
    }

    await Lesson.updateMany(
      { group: updatedGroup._id },
      { $push: { students: { $each: addedStudentsIds } } }
    );

    await Lesson.updateMany(
      { group: updatedGroup._id },
      { $pull: { students: { student: { $in: removedStudentsIds } } } }
    );

    const newGroup = await Group.findById(updatedGroup._id);

    createLessons(newGroup);

    res.status(200).json(updatedGroup);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Cancel group changes
export const cancelGroupChanges = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await Group.findByIdAndUpdate(
      id,
      { changes: {} },
      { new: true }
    ).populate("teachers students course mentors");

    res.status(200).json(group);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
