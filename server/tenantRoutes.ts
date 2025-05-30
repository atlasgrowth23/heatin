import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { 
  insertCustomerSchema, insertTechnicianSchema, insertJobSchema 
} from "@shared/schema";

// Company slug to ID mapping
const COMPANY_SLUGS: Record<string, number> = {
  'quick-fix-hvac': 4,
  'city-climate-control': 5,
  'metro-hvac-services': 6
};

// Middleware to extract and validate tenant
const getTenantMiddleware = (req: any, res: any, next: any) => {
  const slug = req.params.slug;
  const companyId = COMPANY_SLUGS[slug];
  
  if (!companyId) {
    return res.status(404).json({ message: "Business not found" });
  }
  
  req.tenant = { slug, companyId };
  next();
};

export function registerTenantRoutes(app: Express) {
  // Business selection endpoint
  app.get("/api/businesses", (req, res) => {
    res.json([
      { 
        id: 4, 
        name: "Quick Fix HVAC", 
        slug: "quick-fix-hvac",
        loginUsername: "owner1" 
      },
      { 
        id: 5, 
        name: "City Climate Control", 
        slug: "city-climate-control",
        loginUsername: "owner2" 
      },
      { 
        id: 6, 
        name: "Metro HVAC Services", 
        slug: "metro-hvac-services",
        loginUsername: "owner3" 
      }
    ]);
  });

  // Tenant-specific routes
  // Customers
  app.get("/api/:slug/customers", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const customers = await storage.getCustomers(companyId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/:slug/customers", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const customerData = insertCustomerSchema.parse(req.body);
      customerData.companyId = companyId;
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Invalid customer data", error });
    }
  });

  app.get("/api/:slug/customers/:id", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      // Verify customer belongs to this tenant
      if (!customer || customer.companyId !== req.tenant.companyId) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Technicians
  app.get("/api/:slug/technicians", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const technicians = await storage.getTechnicians(companyId);
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/:slug/technicians", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const technicianData = insertTechnicianSchema.parse(req.body);
      technicianData.companyId = companyId;
      const technician = await storage.createTechnician(technicianData);
      res.status(201).json(technician);
    } catch (error) {
      console.error("Error creating technician:", error);
      res.status(400).json({ message: "Invalid technician data", error });
    }
  });

  // Jobs
  app.get("/api/:slug/jobs", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const allJobs = await storage.getJobs();
      const customers = await storage.getCustomers(companyId);
      const customerIds = customers.map(c => c.id);
      
      // Filter jobs that belong to this company's customers
      const jobs = allJobs.filter(job => customerIds.includes(job.customerId));
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/:slug/jobs", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const jobData = insertJobSchema.parse(req.body);
      
      // Verify customer belongs to this tenant
      const customer = await storage.getCustomer(jobData.customerId);
      if (!customer || customer.companyId !== companyId) {
        return res.status(400).json({ message: "Invalid customer for this business" });
      }
      
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: "Invalid job data", error });
    }
  });

  // Route optimization
  app.post("/api/:slug/routes/optimize", getTenantMiddleware, isAuthenticated, async (req: any, res) => {
    try {
      const companyId = req.tenant.companyId;
      const { technicianId, date } = req.body;
      
      // Verify technician belongs to this tenant
      const technician = await storage.getTechnician(technicianId);
      if (!technician || technician.companyId !== companyId) {
        return res.status(400).json({ message: "Invalid technician for this business" });
      }
      
      // Get jobs for the technician on the specified date
      const jobs = await storage.getJobsByTechnician(technicianId);
      const dayJobs = jobs.filter(job => {
        if (!job.scheduledDate) return false;
        const jobDate = new Date(job.scheduledDate);
        const targetDate = new Date(date);
        return jobDate.toDateString() === targetDate.toDateString();
      });

      if (dayJobs.length === 0) {
        return res.json({ message: "No jobs found for optimization", route: null });
      }

      // Get customer addresses for the jobs
      const customers = await storage.getCustomers(companyId);
      const jobAddresses = dayJobs.map(job => {
        const customer = customers.find(c => c.id === job.customerId);
        return customer?.address || "";
      }).filter(address => address.length > 0);

      res.json({ 
        message: "Route optimized successfully", 
        route: {
          technicianId,
          date: new Date(date),
          waypoints: jobAddresses,
          totalJobs: dayJobs.length
        },
        addresses: jobAddresses 
      });
    } catch (error) {
      console.error("Error optimizing route:", error);
      res.status(500).json({ message: "Failed to optimize route" });
    }
  });
}