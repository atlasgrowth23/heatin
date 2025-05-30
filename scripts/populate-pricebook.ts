import { db } from "../server/db.js";
import { globalPricebook } from "../shared/schema.js";

// HVAC Pricebook Data from starting_pricebook.py
const pricebookItems = [
  // Maintenance
  {
    sku: "AC-TU-01",
    category: "Maintenance > Tune-Up",
    taskName: "Full A/C Tune‑Up (1 System)",
    techNotes: "Check ΔT, clean outdoor coil, flush drain, tighten lugs",
    customerDescription: "Seasonal tune‑up & 21‑point inspection",
    standardPrice: "185.00",
    membershipPrice: "135.00",
    afterHoursPrice: "250.00",
    estHours: "1.0",
    equipmentType: "Air Conditioner",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "HT-TU-01",
    category: "Maintenance > Tune-Up",
    taskName: "Gas Furnace Tune‑Up",
    techNotes: "Clean burners, check flame sensor, inspect HX",
    customerDescription: "Annual furnace tune‑up & safety check",
    standardPrice: "165.00",
    membershipPrice: "120.00",
    afterHoursPrice: "225.00",
    estHours: "1.0",
    equipmentType: "Furnace",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "HP-TU-01",
    category: "Maintenance > Tune-Up",
    taskName: "Heat Pump Tune‑Up",
    techNotes: "Defrost board test, coil wash, refrigerant check",
    customerDescription: "Comprehensive heat‑pump tune‑up",
    standardPrice: "195.00",
    membershipPrice: "145.00",
    afterHoursPrice: "260.00",
    estHours: "1.2",
    equipmentType: "Heat Pump",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "IAQ-FLT-01",
    category: "Maintenance > Filter",
    taskName: "Replace Standard 1\" Filter (pair)",
    techNotes: "Verify airflow direction",
    customerDescription: "Change disposable 1\" filters",
    standardPrice: "35.00",
    membershipPrice: "25.00",
    afterHoursPrice: "50.00",
    estHours: "0.2",
    equipmentType: "Air Conditioner",
    partsKit: "1\" Filter (2)",
    warrantyCode: ""
  },
  {
    sku: "IAQ-FLT-02",
    category: "Maintenance > Filter",
    taskName: "Replace 4\" Media Filter",
    techNotes: "Check static pressure post-change",
    customerDescription: "Media filter replacement",
    standardPrice: "90.00",
    membershipPrice: "70.00",
    afterHoursPrice: "120.00",
    estHours: "0.3",
    equipmentType: "Air Conditioner",
    partsKit: "4\" Media Filter",
    warrantyCode: ""
  },
  {
    sku: "MAI-COIL-CL",
    category: "Maintenance > Cleaning",
    taskName: "Outdoor Coil Deep‑Clean",
    techNotes: "Chemical foaming coil cleaner, low‑pressure rinse",
    customerDescription: "Deep clean outdoor condenser coil",
    standardPrice: "185.00",
    membershipPrice: "145.00",
    afterHoursPrice: "245.00",
    estHours: "1.0",
    equipmentType: "Air Conditioner",
    partsKit: "Foam cleaner",
    warrantyCode: ""
  },
  {
    sku: "MAI-BLOW-CL",
    category: "Maintenance > Cleaning",
    taskName: "Blower Wheel Cleaning",
    techNotes: "Remove wheel, degrease, balance check",
    customerDescription: "Blower wheel cleaning service",
    standardPrice: "225.00",
    membershipPrice: "175.00",
    afterHoursPrice: "295.00",
    estHours: "1.3",
    equipmentType: "Air Handler",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "MAI-DUC-CL",
    category: "Maintenance > Cleaning",
    taskName: "Duct Sanitizing (up to 10 vents)",
    techNotes: "Fog EPA-listed sanitizer",
    customerDescription: "Whole‑home duct sanitizing treatment",
    standardPrice: "350.00",
    membershipPrice: "280.00",
    afterHoursPrice: "450.00",
    estHours: "1.5",
    equipmentType: "Ductwork",
    partsKit: "Sanitizer",
    warrantyCode: ""
  },
  {
    sku: "MAI-DRAIN-CLR",
    category: "Maintenance > Cleaning",
    taskName: "Condensate Drain Flush",
    techNotes: "Vacuum & flush with condensate tablets",
    customerDescription: "Clear & treat AC drain line",
    standardPrice: "120.00",
    membershipPrice: "90.00",
    afterHoursPrice: "160.00",
    estHours: "0.6",
    equipmentType: "Air Conditioner",
    partsKit: "Drain tabs",
    warrantyCode: ""
  },
  {
    sku: "MAI-INSP-01",
    category: "Maintenance > Inspection",
    taskName: "Comprehensive System Inspection",
    techNotes: "Document 30‑point checklist in app",
    customerDescription: "Full HVAC inspection report",
    standardPrice: "140.00",
    membershipPrice: "105.00",
    afterHoursPrice: "190.00",
    estHours: "1.0",
    equipmentType: "HVAC System",
    partsKit: "",
    warrantyCode: ""
  },
  // Diagnostics
  {
    sku: "DIAG-AC",
    category: "Diagnostic",
    taskName: "A/C System Diagnostic (No Cool)",
    techNotes: "Pressure check, electrical diagnostics",
    customerDescription: "Diagnostic visit – air conditioner not cooling",
    standardPrice: "99.00",
    membershipPrice: "75.00",
    afterHoursPrice: "149.00",
    estHours: "0.8",
    equipmentType: "Air Conditioner",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "DIAG-FUR",
    category: "Diagnostic",
    taskName: "Furnace Diagnostic (No Heat)",
    techNotes: "Ignition sequence test, gas pressure",
    customerDescription: "Diagnostic visit – furnace not heating",
    standardPrice: "99.00",
    membershipPrice: "75.00",
    afterHoursPrice: "149.00",
    estHours: "0.8",
    equipmentType: "Furnace",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "DIAG-HP",
    category: "Diagnostic",
    taskName: "Heat Pump Diagnostic",
    techNotes: "Check reversing valve, defrost cycle",
    customerDescription: "Diagnostic visit – heat pump issue",
    standardPrice: "109.00",
    membershipPrice: "85.00",
    afterHoursPrice: "159.00",
    estHours: "0.9",
    equipmentType: "Heat Pump",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "DIAG-IAQ",
    category: "Diagnostic",
    taskName: "Indoor Air Quality Assessment",
    techNotes: "CO, humidity, particulate reading",
    customerDescription: "Whole‑home IAQ evaluation",
    standardPrice: "80.00",
    membershipPrice: "60.00",
    afterHoursPrice: "120.00",
    estHours: "0.7",
    equipmentType: "HVAC System",
    partsKit: "",
    warrantyCode: ""
  },
  {
    sku: "DIAG-ELC",
    category: "Diagnostic",
    taskName: "Electrical Fault Diagnostic",
    techNotes: "Megohm test motors, inspect wiring",
    customerDescription: "Electrical troubleshooting visit",
    standardPrice: "120.00",
    membershipPrice: "95.00",
    afterHoursPrice: "170.00",
    estHours: "1.0",
    equipmentType: "HVAC System",
    partsKit: "",
    warrantyCode: ""
  },
  // Repairs
  {
    sku: "AC-CAP-45",
    category: "Repair > Electrical",
    taskName: "Replace Capacitor 45/5 µF",
    techNotes: "Verify microfarads ±6%",
    customerDescription: "Capacitor replacement",
    standardPrice: "220.00",
    membershipPrice: "175.00",
    afterHoursPrice: "310.00",
    estHours: "0.6",
    equipmentType: "Air Conditioner",
    partsKit: "45/5 Cap",
    warrantyCode: ""
  },
  {
    sku: "AC-CNT-40",
    category: "Repair > Electrical",
    taskName: "Replace Contactor 40 A",
    techNotes: "Check coil voltage and line lugs",
    customerDescription: "Contactor replacement",
    standardPrice: "240.00",
    membershipPrice: "190.00",
    afterHoursPrice: "330.00",
    estHours: "0.7",
    equipmentType: "Air Conditioner",
    partsKit: "40A Contactor",
    warrantyCode: ""
  },
  {
    sku: "AC-MTR-COND",
    category: "Repair > Mechanical",
    taskName: "Condenser Fan‑Motor Replacement",
    techNotes: "Replace fan blades if bent",
    customerDescription: "Condenser fan motor replacement",
    standardPrice: "540.00",
    membershipPrice: "450.00",
    afterHoursPrice: "690.00",
    estHours: "1.5",
    equipmentType: "Air Conditioner",
    partsKit: "Motor, capacitor",
    warrantyCode: ""
  },
  {
    sku: "AC-COMP-RPL",
    category: "Repair > Mechanical",
    taskName: "Compressor Replacement (3‑ton, R‑410A)",
    techNotes: "Weigh in R‑410A charge to spec",
    customerDescription: "Air‑conditioner compressor replacement",
    standardPrice: "2450.00",
    membershipPrice: "2150.00",
    afterHoursPrice: "3150.00",
    estHours: "4.0",
    equipmentType: "Air Conditioner",
    partsKit: "Compressor, drier",
    warrantyCode: "COMP-10YR"
  },
  {
    sku: "AC-COIL-EVAP",
    category: "Repair > Mechanical",
    taskName: "Evaporator Coil Replacement",
    techNotes: "Install TXV, pressure test 300 psi",
    customerDescription: "Evaporator coil replacement",
    standardPrice: "1550.00",
    membershipPrice: "1350.00",
    afterHoursPrice: "2050.00",
    estHours: "3.0",
    equipmentType: "Air Conditioner",
    partsKit: "Coil, TXV",
    warrantyCode: ""
  },
  {
    sku: "FUR-IGN",
    category: "Repair > Electrical",
    taskName: "Hot‑Surface Igniter Replacement",
    techNotes: "Verify 120 V to igniter",
    customerDescription: "Igniter replacement",
    standardPrice: "285.00",
    membershipPrice: "230.00",
    afterHoursPrice: "390.00",
    estHours: "0.8",
    equipmentType: "Furnace",
    partsKit: "HSI",
    warrantyCode: ""
  },
  {
    sku: "FUR-HX",
    category: "Repair > Mechanical",
    taskName: "Heat Exchanger Replacement (Gas Furnace)",
    techNotes: "Combustion test post‑install",
    customerDescription: "Heat exchanger replacement",
    standardPrice: "1350.00",
    membershipPrice: "1150.00",
    afterHoursPrice: "1850.00",
    estHours: "3.5",
    equipmentType: "Furnace",
    partsKit: "HX kit",
    warrantyCode: "HX-20YR"
  },
  {
    sku: "HP-REV-VAL",
    category: "Repair > Refrigerant",
    taskName: "Reversing Valve Replacement",
    techNotes: "Brazing with nitrogen purge",
    customerDescription: "Heat‑pump reversing valve replacement",
    standardPrice: "1600.00",
    membershipPrice: "1400.00",
    afterHoursPrice: "2100.00",
    estHours: "3.5",
    equipmentType: "Heat Pump",
    partsKit: "Rev valve, drier",
    warrantyCode: ""
  },
  {
    sku: "AC-TXV-RPL",
    category: "Repair > Refrigerant",
    taskName: "TXV Replacement",
    techNotes: "Adjust superheat post‑install",
    customerDescription: "Thermostatic expansion valve replacement",
    standardPrice: "780.00",
    membershipPrice: "640.00",
    afterHoursPrice: "1010.00",
    estHours: "2.0",
    equipmentType: "Air Conditioner",
    partsKit: "TXV, drier",
    warrantyCode: ""
  },
  // Installations
  {
    sku: "IAQ-UV-01",
    category: "Install > IAQ",
    taskName: "Install 24 V UV Light",
    techNotes: "Wire to R & C, mount in supply plenum",
    customerDescription: "Install germicidal UV light",
    standardPrice: "385.00",
    membershipPrice: "335.00",
    afterHoursPrice: "485.00",
    estHours: "1.2",
    equipmentType: "Air Handler",
    partsKit: "UV kit",
    warrantyCode: ""
  },
  {
    sku: "IAQ-STAT-WIFI",
    category: "Install > Controls",
    taskName: "Install Wi‑Fi Thermostat",
    techNotes: "Connect Wi‑Fi, educate homeowner",
    customerDescription: "Wi‑Fi thermostat install & setup",
    standardPrice: "325.00",
    membershipPrice: "275.00",
    afterHoursPrice: "425.00",
    estHours: "1.0",
    equipmentType: "Controls",
    partsKit: "Wi‑Fi thermostat",
    warrantyCode: ""
  }
];

async function populatePricebook() {
  try {
    console.log("Starting pricebook population...");
    
    // Clear existing data
    await db.delete(globalPricebook);
    console.log("Cleared existing pricebook data");
    
    // Insert new data
    for (const item of pricebookItems) {
      await db.insert(globalPricebook).values(item);
    }
    
    console.log(`Successfully populated ${pricebookItems.length} pricebook items`);
    
    // Show summary by category
    const categoryCounts = pricebookItems.reduce((acc, item) => {
      const category = item.category.split(' > ')[0];
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\nPricebook summary by category:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });
    
  } catch (error) {
    console.error("Error populating pricebook:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  populatePricebook()
    .then(() => {
      console.log("Pricebook population completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to populate pricebook:", error);
      process.exit(1);
    });
}

export { populatePricebook };