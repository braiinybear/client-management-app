// const { PrismaClient, Role, Status } = require("@prisma/client");
// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Seeding database...");

//   // Ensure admin exists
//   const admin = await prisma.user.findFirst({
//     where: { role: Role.ADMIN },
//   });

//   if (!admin) {
//     throw new Error("❌ No admin found. Please create one before seeding.");
//   }

//   // Create employees
//   const employees = await Promise.all(
//     ["John Doe", "Jane Smith", "Emily Johnson"].map((name, index) =>
//       prisma.user.upsert({
//         where: { email: `employee${index + 1}@example.com` },
//         update: {},
//         create: {
//           clerkId: `employee-clerk-id-${index + 1}`,
//           name,
//           email: `employee${index + 1}@example.com`,
//           role: Role.EMPLOYEE,
//         },
//       })
//     )
//   );

//   const statuses = [
//     Status.HOT,
//     Status.PROSPECT,
//     Status.FOLLOWUP,
//     Status.COLD,
//     Status.SUCCESS,
//   ];

//   // Generate 30 clients
//   for (let i = 1; i <= 30; i++) {
//     const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
//     const assignedEmployee = Math.random() > 0.4
//       ? employees[Math.floor(Math.random() * employees.length)]
//       : null;

//     const courseFee = 3000 + Math.floor(Math.random() * 2000); // 3000–5000
//     const hostelFee = 1000 + Math.floor(Math.random() * 2000); // 1000–3000
//     const totalFee = courseFee + hostelFee;

//     const courseFeePaid = Math.floor(Math.random() * courseFee);
//     const hostelFeePaid = Math.floor(Math.random() * hostelFee);
//     const totalFeePaid = courseFeePaid + hostelFeePaid;

//     const client = await prisma.client.create({
//       data: {
//         name: `Client ${i}`,
//         email: `client${i}@example.com`,
//         phone: `555-000-${String(i).padStart(4, "0")}`,
//         status: randomStatus,
//         course: `Course ${Math.ceil(Math.random() * 5)}`,
//         hostelFee,
//         courseFee,
//         totalFee,
//         hostelFeePaid,
//         courseFeePaid,
//         totalFeePaid,
//         userId: admin.id,
//         assignedEmployeeId: assignedEmployee?.id || null,
//       },
//     });

//     // Add documents to some clients
//     if (Math.random() > 0.5) {
//       await prisma.document.createMany({
//         data: [
//           {
//             name: `ID Proof for ${client.name}`,
//             url: `https://example.com/docs/${client.id}-1.pdf`,
//             clientId: client.id,
//           },
//           {
//             name: `Enrollment Form for ${client.name}`,
//             url: `https://example.com/docs/${client.id}-2.pdf`,
//             clientId: client.id,
//           },
//         ],
//       });
//     }
//   }

//   console.log("✅ Database seeded successfully!");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });





//   const { PrismaClient, Role, Status } = require("@prisma/client");
// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Seeding database...");

//   // Find employee user by email (replace with your actual email)
//   const employee = await prisma.user.findUnique({
//     where: { email: "nikachan162@gmail.com" }, // <-- specify employee email here
//   });

//   if (!employee) {
//     throw new Error("❌ Employee with email nikachan162@gmail.com not found.");
//   }

//   // Now create clients assigned to this employee
//   const statuses = [
//     Status.HOT,
//     Status.PROSPECT,
//     Status.FOLLOWUP,
//     Status.COLD,
//     Status.SUCCESS,
//   ];

//   for (let i = 1; i <= 30; i++) {
//     const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

//     const courseFee = 3000 + Math.floor(Math.random() * 2000);
//     const hostelFee = 1000 + Math.floor(Math.random() * 2000);
//     const totalFee = courseFee + hostelFee;

//     const courseFeePaid = Math.floor(Math.random() * courseFee);
//     const hostelFeePaid = Math.floor(Math.random() * hostelFee);
//     const totalFeePaid = courseFeePaid + hostelFeePaid;

//     await prisma.client.create({
//       data: {
//         name: `Client ${i}`,
//         email: `client${i}@example.com`,
//         phone: `555-000-${String(i).padStart(4, "0")}`,
//         status: randomStatus,
//         course: `Course ${Math.ceil(Math.random() * 5)}`,
//         hostelFee,
//         courseFee,
//         totalFee,
//         hostelFeePaid,
//         courseFeePaid,
//         totalFeePaid,
//         userId: employee.id,            // <-- creator is employee
//         assignedEmployeeId: employee.id, // <-- assigned employee is same employee
//       },
//     });
//   }

//   console.log("✅ Clients assigned to employee seeded successfully!");
// }


// main()
//   .catch((e) => {
//     console.error("❌ Seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });




//************************************** converting propect to null ****************************************************************//

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Finding all clients with status = 'PROSPECT'...");

  // Count how many will be updated
  const count = await prisma.client.count({
    where: { status: "PROSPECT" },
  });

  if (count === 0) {
    console.log("✅ No clients found with 'PROSPECT' status. Nothing to update.");
    return;
  }

  console.log(`📦 Found ${count} clients. Updating their status to null...`);

  // Update all matching records in one go
  const result = await prisma.client.updateMany({
    where: { status: "PROSPECT" },
    data: { status: null },
  });

  console.log(`✅ Successfully updated ${result.count} client records.`);
}

main()
  .catch((err) => {
    console.error("❌ Error updating clients:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
