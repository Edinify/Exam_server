import { Notification } from "../models/notificationModel.js";

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Viewed notifications

export const viewNotifications = async (req, res) => {
  const { id } = req.user;
  try {
    const notifications = await Notification.find({
      recipients: {
        $elemMatch: {
          user: id,
          viewed: false,
        },
      },
    });

    notifications.forEach(async (notification) => {
      notification.recipients.forEach((recipient) => {
        if (recipient.user.toString() === id) {
          recipient.viewed = true;
        }
      });

      await notification.save();
    });

    res.status(200);
  } catch (err) {
    console.log({ message: { error: err.message } });
    return false;
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.findByIdAndUpdate(id, {});

    return true;
  } catch (err) {
    console.log({ message: { error: err.message } });
    return false;
  }
};
