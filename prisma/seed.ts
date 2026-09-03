import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../src/lib/env.js";

const prisma = new PrismaClient();

// Idempotent: creates the admin user if one with the configured email doesn't already exist.
// Never overwrites an existing user's password (admin may have changed it via the UI).
async function seedAdmin() {
    const email = env.adminEmail;
    const password = env.adminPassword;

    if (!email || !password) {
        throw new Error(
            "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the admin user"
        );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.info(
            `✅ Admin already exists: ${email} — skipping (password unchanged)`
        );
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
        data: { email, passwordHash, name: "Admin" },
    });
    console.info(
        `✅ Admin created: ${email} (externalId: ${admin.externalId})`
    );
}

const INSTITUTE = {
    name: "FARRUKH ACADEMY OF SCIENCE",
    address:
        "Dhobi Ghat Stop Near Nafeerabad Graveyard Shalimar Town Lahore",
    phone: "+92 324 0012215",
};

// Idempotent: creates the Institute row if one with this name doesn't already exist.
async function seedInstitute() {
    const existing = await prisma.institute.findFirst({
        where: { name: INSTITUTE.name },
    });
    if (existing) {
        console.info(
            `✅ Institute already exists: ${INSTITUTE.name} — skipping`
        );
        return;
    }

    const institute = await prisma.institute.create({ data: INSTITUTE });
    console.info(
        `✅ Institute created: ${INSTITUTE.name} (externalId: ${institute.externalId})`
    );
}

// Destructive — wipes existing GradeScale rows.
async function seedGradeScales() {
    console.info("🌱 Seeding GradeScale...");
    await prisma.gradeScale.deleteMany();
    await prisma.gradeScale.createMany({
        data: [
            {
                grade: "A+",
                minPercentage: 80,
                maxPercentage: 100,
                remarks:
                    "Excellent Performance Overall. Don't Be Lazy. More Hardwork Makes You More Successful. In sha ALLAH",
            },
            {
                grade: "A",
                minPercentage: 70,
                maxPercentage: 79.99,
                remarks:
                    "Good Performance Overall. Do More Effort To Get Higher Grade's. More Hardwork Makes You More Successful. In sha ALLAH",
            },
            {
                grade: "B",
                minPercentage: 60,
                maxPercentage: 69.99,
                remarks:
                    "Fair Performance Overall. Not Bad At All. But Do More Effort To Get Higher Grade's And Be Motivated All The Time. More Hardwork Makes You More Successful. In sha ALLAH",
            },
            {
                grade: "C",
                minPercentage: 50,
                maxPercentage: 59.99,
                remarks:
                    "Not A Fair Performance Overall. But Do More Effort To Get Higher Grade's And Be Motivated All The Time. Need Serious Attention Towards Studies. More Hardwork Makes You More Successful. In sha ALLAH",
            },
            {
                grade: "D",
                minPercentage: 33,
                maxPercentage: 49.99,
                remarks:
                    "Poor Performance Overall. Be Motivated. Need Serious Attention Towards Your Studies. More Hardwork Makes You More Successful. In sha ALLAH",
            },
            {
                grade: "F",
                minPercentage: 0,
                maxPercentage: 32.99,
                remarks:
                    "Failure isn't fatal, but failure to change might be. Only those who dare to fail greatly can ever achieve greatly. Be Motivated. More Hardwork Makes You More Successful. In sha ALLAH",
            },
        ],
    });
    console.info("✅ GradeScale seeded successfully");
}

// Destructive — wipes existing Class rows.
async function seedClasses() {
    console.info("🌱 Seeding Classes...");
    await prisma.class.deleteMany();
    await prisma.class.createMany({
        data: [
            { name: "Class 1", isActive: true },
            { name: "Class 2", isActive: true },
            { name: "Class 3", isActive: true },
            { name: "Class 4", isActive: true },
            { name: "Class 5", isActive: true },
            { name: "Class 6", isActive: true },
            { name: "Class 7", isActive: true },
            { name: "Class 8", isActive: true },
            { name: "Class 9", isActive: true },
            { name: "Class 10", isActive: true },
            { name: "Class 11", isActive: true },
            { name: "Class 12", isActive: true },
        ],
    });
    console.info("✅ Classes seeded successfully");
}

async function main() {
    console.info("🌱 Seeding Admin user...");
    await seedAdmin();

    console.info("🌱 Seeding Institute...");
    await seedInstitute();

    if (env.seedDevData) {
        console.info(
            "🌱 SEED_DEV_DATA=true — also seeding default GradeScales and Classes (destructive)..."
        );
        await seedGradeScales();
        await seedClasses();
    } else {
        console.info(
            "ℹ️  Skipping GradeScale + Class defaults. Set SEED_DEV_DATA=true to (re-)seed them (will wipe existing rows)."
        );
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
