import jwt from "jsonwebtoken";

const jwtAuth = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ status: false, message: "UNAUTHORIZED" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

      req.user = decoded;
      next();
    } catch (error) {
      let message = "INVALID_ACCESS_TOKEN";
      if (error.name === "TokenExpiredError") message = "ACCESS_TOKEN_EXPIRED";

      return res.status(401).json({ status: false, message });
    }
  };
};

export default jwtAuth;
