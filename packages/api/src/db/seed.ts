import { db } from "./index";
import { adminUsers } from "./schema";
import { hash } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

/**
 * Seed script: creates initial admin user.
 *
 * Usage: bun src/db/seed.ts
 */
async function seed() {
  const email = process.env.ADMIN_INITIAL_EMAIL || "admin@investec.com";
  const password = process.env.ADMIN_INITIAL_PASSWORD || "changeme123";

  console.log("🌱 Seeding database...");

  const passwordHash = await hash(password, 12);

  try {
    db.insert(adminUsers)
      .values({
        id: createId(),
        email,
        passwordHash,
        name: "Admin",
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .run();

    console.log(`✅ Admin user created: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ⚠️  Change this password immediately!`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
