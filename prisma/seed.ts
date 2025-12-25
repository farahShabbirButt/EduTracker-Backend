import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
