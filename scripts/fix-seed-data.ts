import { db } from "../server/db";
import { storage } from "../server/storage";

async function fixSeedData() {
  console.log("🗑️ Clearing existing data...");
  
  // Clear existing data
  await db.execute(`DELETE FROM jobs`);
  await db.execute(`DELETE FROM technicians`);
  await db.execute(`DELETE FROM customers`);
  await db.execute(`DELETE FROM user_roles`);
  await db.execute(`DELETE FROM users WHERE username LIKE 'owner%' OR username LIKE 'tech%'`);
  await db.execute(`DELETE FROM companies`);

  console.log("🌱 Creating proper seed data...");

  // Create exactly 3 companies with proper technician structure
  const companyData = [
    {
      name: "Quick Fix HVAC",
      address: "123 Main St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      phone: "(512) 555-0101",
      email: "info@quickfixhvac.com",
      technicians: [
        { name: "Mike Johnson", initials: "MJ", isOwner: true }
      ]
    },
    {
      name: "City Climate Control", 
      address: "456 Oak Ave",
      city: "Dallas",
      state: "TX", 
      zipCode: "75201",
      phone: "(214) 555-0202",
      email: "info@cityclimate.com",
      technicians: [
        { name: "Sarah Davis", initials: "SD", isOwner: true },
        { name: "Tom Wilson", initials: "TW", isOwner: false }
      ]
    },
    {
      name: "Metro HVAC Services",
      address: "789 Elm St", 
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      phone: "(713) 555-0303",
      email: "info@metrohvac.com",
      technicians: [
        { name: "Alex Rodriguez", initials: "AR", isOwner: true },
        { name: "Jamie Chen", initials: "JC", isOwner: false },
        { name: "Chris Taylor", initials: "CT", isOwner: false }
      ]
    }
  ];

  for (const companyInfo of companyData) {
    // Create company
    const company = await storage.createCompany({
      name: companyInfo.name,
      address: companyInfo.address,
      city: companyInfo.city,
      state: companyInfo.state,
      zipCode: companyInfo.zipCode,
      phone: companyInfo.phone,
      email: companyInfo.email,
      settings: {}
    });

    // Create owner user for login
    const ownerTech = companyInfo.technicians.find(t => t.isOwner);
    if (ownerTech) {
      const ownerUser = await storage.createUser({
        username: `owner${company.id}`,
        password: "demo123",
        name: `${ownerTech.name} (Owner)`,
        email: ownerTech.name.toLowerCase().replace(' ', '.') + `@${companyInfo.name.toLowerCase().replace(/\s+/g, '')}.com`,
        role: "owner"
      });
      
      // Create user role
      await storage.createUserRole({
        userId: ownerUser.id,
        companyId: company.id,
        role: "owner"
      });
    }

    // Create technicians
    for (const techInfo of companyInfo.technicians) {
      const techUser = await storage.createUser({
        username: techInfo.initials.toLowerCase() + company.id,
        password: "demo123", 
        name: techInfo.isOwner ? `${techInfo.name} (Owner)` : techInfo.name,
        email: techInfo.name.toLowerCase().replace(' ', '.') + `@${companyInfo.name.toLowerCase().replace(/\s+/g, '')}.com`,
        role: techInfo.isOwner ? "owner" : "technician"
      });

      const technician = await storage.createTechnician({
        companyId: company.id,
        userId: techUser.id,
        name: techInfo.isOwner ? `${techInfo.name} (${techInfo.initials})` : `${techInfo.name} (${techInfo.initials})`,
        phone: companyInfo.phone,
        email: techUser.email,
        specialties: ["HVAC Repair", "Installation", "Maintenance"],
        certifications: ["EPA 608", "NATE Certified"],
        status: "active"
      });

      console.log(`✓ Created technician: ${technician.name} for ${company.name}`);
    }

    // Create realistic customers for each company
    const customerNames = [
      "Johnson Residence", "Smith Family Home", "Williams Property", 
      "Brown Household", "Davis Estate", "Miller Residence"
    ];

    const addresses = [
      { street: "1234 Pine St", city: companyInfo.city, zip: "78702" },
      { street: "5678 Cedar Ave", city: companyInfo.city, zip: "78703" },
      { street: "9012 Maple Dr", city: companyInfo.city, zip: "78704" },
      { street: "3456 Birch Ln", city: companyInfo.city, zip: "78705" },
      { street: "7890 Willow Way", city: companyInfo.city, zip: "78706" }
    ];

    for (let i = 0; i < 5; i++) {
      const customer = await storage.createCustomer({
        companyId: company.id,
        name: customerNames[i],
        email: `${customerNames[i].toLowerCase().replace(/\s+/g, '')}@email.com`,
        phone: `(${companyInfo.phone.slice(1, 4)}) ${555 + i}-${1000 + i}`,
        address: `${addresses[i].street}, ${addresses[i].city}, ${companyInfo.state} ${addresses[i].zip}`,
        city: addresses[i].city,
        state: companyInfo.state,
        zipCode: addresses[i].zip
      });

      console.log(`✓ Created customer: ${customer.name} for ${company.name}`);
    }

    console.log(`✅ Created company "${company.name}" with ${companyInfo.technicians.length} technicians and 5 customers`);
  }

  console.log("\n🎉 Fixed seed data created successfully!");
  console.log("\nLogin credentials:");
  console.log("Quick Fix HVAC: owner1 / demo123");
  console.log("City Climate Control: owner2 / demo123"); 
  console.log("Metro HVAC Services: owner3 / demo123");
}

// Run the fix
fixSeedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  });