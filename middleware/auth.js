import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.sendStatus(401);
    }

    try {
      jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: "Authorization header is missing" });
  }
};

// Check super admin role
export const checkSuperAdmin = async (req, res, next) => {
  if (req.user.role !== "super-admin") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};

// Check admin role
export const checkAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};

// Check admin and super admin
export const checkAdminAndSuperAdmin = async (req, res, next) => {
  console.log("checkAdminAndSuperAdmin");
  if (req.user.role !== "admin" && req.user.role !== "super-admin") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};

// Check teacher
export const checkTeacher = async (req, res, next) => {
  console.log("checkTeacher");
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};
