import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 10;

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_LIFE,
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_LIFE,
  });

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res
          .status(428)
          .json({ status: false, message: "MISSING_REQUIRED_FIELDS" });

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          password: true,
          email: true,
          fullname: true,
          // HAPUS roles dari sini karena tidak ada di schema
        },
      });

      if (!user)
        return res
          .status(401)
          .json({ status: false, message: "USER NOT FOUND" });

      let passwordMatches = false;

      if (user.password.startsWith("$2")) {
        // bcrypt
        passwordMatches = await bcrypt.compare(password, user.password);
      } else {
        // password lama MD5 → upgrade ke bcrypt
        const md5Hash = crypto.createHash("md5").update(password).digest("hex");
        if (md5Hash === user.password) {
          passwordMatches = true;
          const newBcrypt = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newBcrypt },
          });
        }
      }

      if (!passwordMatches)
        return res
          .status(401)
          .json({ status: false, message: "INVALID CREDENTIAL" });

      // Login success → generate tokens
      const payload = { id: user.id };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // HAPUS bagian roles karena tidak ada di schema
      return res.status(200).json({
        status: true,
        message: "LOGIN_SUCCESS",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullname: user.fullname,
          // roles: userRoles, // HAPUS INI
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ status: false, message: "INTERNAL_SERVER_ERROR" });
    }
  }
}

export default new AuthController();
