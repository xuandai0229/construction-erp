import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("ENV:", process.env.DATABASE_URL); // debug

    const project = await prisma.project.create({
        data: {
            name: "Test OK thật",
        },
    });

    console.log("SUCCESS:", project);
}
console.log("ENV DEBUG:", process.env.DATABASE_URL);
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());