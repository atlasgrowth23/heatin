import { db } from "../server/db";
import { 
  companies, users, userRoles, customers, technicians, jobs,
  type InsertCompany, type InsertUser, type InsertUserRole, 
  type InsertCustomer, type InsertTechnician, type InsertJob
} from "../shared/schema";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await db.delete(jobs);
  await db.delete(technicians);
  await db.delete(customers);
  await db.delete(userRoles);
  await db.delete(users);
  await db.delete(companies);

  // Create companies
  const companyData: InsertCompany[] = [
    {
      name: "Quick Fix HVAC",
      address: "123 Main St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      phone: "(512) 555-0100",
      email: "contact@quickfixhvac.com",
      settings: { timezone: "America/Chicago" }
    },
    {
      name: "City Climate Control",
      address: "456 Oak Avenue",
      city: "Dallas",
      state: "TX", 
      zipCode: "75201",
      phone: "(214) 555-0200",
      email: "info@cityclimate.com",
      settings: { timezone: "America/Chicago" }
    },
    {
      name: "Metro HVAC Services",
      address: "789 Pine Street",
      city: "Houston",
      state: "TX",
      zipCode: "77001", 
      phone: "(713) 555-0300",
      email: "service@metrohvac.com",
      settings: { timezone: "America/Chicago" }
    }
  ];

  const insertedCompanies = await db.insert(companies).values(companyData).returning();
  console.log(`✅ Created ${insertedCompanies.length} companies`);

  // Create users and technicians for each company
  const hashedPassword = await bcrypt.hash("demo123", 10);
  
  for (const [index, company] of insertedCompanies.entries()) {
    const techCount = index + 1; // 1, 2, 3 technicians respectively
    
    // Create owner user
    const ownerUser = await db.insert(users).values({
      username: `owner${index + 1}`,
      password: hashedPassword,
      name: `${company.name} Owner`,
      email: `owner@${company.email}`,
      role: "owner"
    }).returning();

    await db.insert(userRoles).values({
      userId: ownerUser[0].id,
      companyId: company.id,
      role: "owner"
    });

    // Create technicians
    for (let i = 0; i < techCount; i++) {
      const techUser = await db.insert(users).values({
        username: `tech${company.id}_${i + 1}`,
        password: hashedPassword,
        name: `Technician ${i + 1}`,
        email: `tech${i + 1}@${company.email}`,
        role: "technician"
      }).returning();

      await db.insert(userRoles).values({
        userId: techUser[0].id,
        companyId: company.id,
        role: "technician"
      });

      await db.insert(technicians).values({
        companyId: company.id,
        userId: techUser[0].id,
        name: `Technician ${i + 1}`,
        email: `tech${i + 1}@${company.email}`,
        phone: `(${company.phone.slice(1, 4)}) 555-${String(i + 1).padStart(4, '0')}`,
        specialties: i === 0 ? ["AC Repair", "Installation"] : ["Heating", "Maintenance"],
        status: "active",
        hourlyRate: "45.00"
      });
    }

    // Create sample customers with real addresses for Maps testing
    const customerAddresses = [
      { address: "100 Congress Ave", city: "Austin", state: "TX", zipCode: "78701" },
      { address: "200 W 6th St", city: "Austin", state: "TX", zipCode: "78701" },
      { address: "300 E 7th St", city: "Austin", state: "TX", zipCode: "78702" },
      { address: "400 S Lamar Blvd", city: "Austin", state: "TX", zipCode: "78704" },
      { address: "500 Barton Springs Rd", city: "Austin", state: "TX", zipCode: "78704" }
    ];

    for (let i = 0; i < 5; i++) {
      const addr = customerAddresses[i];
      await db.insert(customers).values({
        companyId: company.id,
        name: `Customer ${company.id}-${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `(${company.phone.slice(1, 4)}) 555-${String(1000 + i).padStart(4, '0')}`,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        notes: i === 0 ? "Preferred customer - priority service" : null
      });
    }

    console.log(`✅ Created company "${company.name}" with ${techCount} technicians and 5 customers`);
  }

  console.log("🎉 Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Quick Fix HVAC: owner1 / demo123");
  console.log("City Climate Control: owner2 / demo123");
  console.log("Metro HVAC Services: owner3 / demo123");
}

// Run the seed function
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });

export { seedDatabase };