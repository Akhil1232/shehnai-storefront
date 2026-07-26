/**
 * Creates or resets the first admin user.
 *   npm run admin:create -- owner@shehnai.in "MyPassword123" "Your Name"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password, name = "Owner"] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run admin:create -- <email> "<password>" "<name>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, name, role: "OWNER", isActive: true },
    create: { email: email.toLowerCase(), passwordHash, name, role: "OWNER" },
  });
  console.log(`Admin ready: ${user.email} (${user.role})`);
  console.log("Sign in at /admin/login");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
