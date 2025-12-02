import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 10;

const users = [
  {
    username: "admin",
    fullname: "Administrator",
    email: "admin@example.com",
    password: "password123",
  },
  {
    username: "user1",
    fullname: "Regular User",
    email: "user1@example.com",
    password: "password123",
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(
      userData.password,
      BCRYPT_SALT_ROUNDS
    );

    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {
        password: hashedPassword,
        fullname: userData.fullname,
        email: userData.email,
      },
      create: {
        username: userData.username,
        fullname: userData.fullname,
        email: userData.email,
        password: hashedPassword,
      },
    });

    console.log(`✅ User ${user.username} created/updated`);
  }

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
