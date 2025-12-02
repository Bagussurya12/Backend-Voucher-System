import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import router from "./src/routes/index.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: ["http://localhost:8000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json({ message: "Server is running", users });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 4400;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
