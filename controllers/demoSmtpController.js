import dotenv from "dotenv";
import nodemailer from "nodemailer";
import logger from "../config/logger.js";

dotenv.config();

export const sendEmailForDemo = async (req, res) => {
  const mainEmail = process.env.EMAIL;
  const password = process.env.PASS;
  const { features, studentCount, name, surName, email, phone, contactTime } =
    req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: mainEmail,
      pass: password,
    },
  });

  const mailOptions = {
    from: mainEmail,
    to: "samedovrasul7@gmail.com",
    subject: "Demo üçün müraciət",
    text: " Edinify.com ",
    html: `<ul>
            <li style=" font-size:20px; "> <b>name</b> : ${name} </li>
            <li style=" font-size:20px; "> <b>surName</b> : ${surName} </li>
            <li style=" font-size:20px; "> <b>email</b> : ${email} </li>
            <li style=" font-size:20px; "> <b>phone</b> : ${phone} </li>
            <li style=" font-size:20px; "> <b>studentCount</b> : ${studentCount} </li>
            <li style=" font-size:20px; "> <b>features</b> : ${features.map(
              (key) => {
                return `${key}`;
              }
            )} </li>
            <li style=" font-size:20px; "> <b>contactTime</b> : ${contactTime.map(
              (key) => {
                return `${key}`;
              }
            )} </li>

          </ul>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      logger.error({
        method: "POST",
        status: 500,
        message: error,
        for: "SEND EMAIL FROM DEMO",
        postedData: req.body,
        functionName: sendEmailForDemo.name,
      });
      return res.status(500).json({ error: error });
    } else {
      res.status(200).json({ message: "request for demo sent successfuly" });
    }
  });
};
