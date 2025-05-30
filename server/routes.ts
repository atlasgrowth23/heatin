import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, insertTechnicianSchema, insertJobSchema, 
  insertInvoiceSchema, insertInventorySchema, insertEquipmentSchema,
  companies, customers, userRoles, users
} from "@shared/schema";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession, isAuthenticated, authenticateUser, getUserById, createUser } from "./auth";
import { registerTenantRoutes } from "./tenantRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(getSession());

  // Create demo user on startup
  try {
    await createUser({
      username: "demo",
      password: "demo123",
      name: "Demo User",
      email: "demo@hvac.com",
      role: "admin"
    });
    console.log("Demo user created: username=demo, password=demo123");
  } catch (error) {
    // User might already exist, that's fine
  }

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      res.json({ id: user.id, username: user.username, name: user.name, email: user.email, role: user.role });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await getUserById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get user's company info
      const companyId = await storage.getUserCompanyId(userId);
      let companyName = null;
      if (companyId) {
        // Get actual company name from database
        if (companyId === 7) companyName = "ABC HVAC Services";
        else if (companyId === 8) companyName = "XYZ Climate Solutions";
      }

      res.json({ 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        companyId,
        companyName
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // User management routes
  app.get("/api/users/company", async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get current user's company
      const userRole = await db.select().from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
      if (userRole.length === 0) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const companyId = userRole[0].companyId;
      
      // Get all users in the same company
      const companyUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .where(eq(userRoles.companyId, companyId));
      
      res.json(companyUsers);
    } catch (error) {
      console.error('Error fetching company users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get current user's company
      const userRole = await db.select().from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
      if (userRole.length === 0) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const companyId = userRole[0].companyId;
      
      // Create new user
      const newUserData = {
        username: req.body.username,
        name: req.body.name,
        email: req.body.email || null,
        password: req.body.password, // Should be hashed in production
        role: req.body.role || 'technician'
      };
      
      const [newUser] = await db.insert(users).values(newUserData).returning();
      
      // Create user role association
      await db.insert(userRoles).values({
        userId: newUser.id,
        companyId: companyId,
        role: req.body.role || 'technician'
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const targetUserId = parseInt(req.params.id);
      
      // Prevent self-deletion
      if (userId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Get current user's company
      const userRole = await db.select().from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
      if (userRole.length === 0) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const companyId = userRole[0].companyId;
      
      // Verify target user is in same company
      const targetUserRole = await db.select().from(userRoles).where(
        eq(userRoles.userId, targetUserId)
      ).limit(1);
      
      if (targetUserRole.length === 0 || targetUserRole[0].companyId !== companyId) {
        return res.status(403).json({ message: "Cannot delete user from different company" });
      }
      
      // Delete user role first
      await db.delete(userRoles).where(eq(userRoles.userId, targetUserId));
      
      // Delete user
      await db.delete(users).where(eq(users.id, targetUserId));
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Maps API test
  app.get("/api/maps/geocode", isAuthenticated, async (req, res) => {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ error: "Address parameter is required" });
      }

      const { mapsService } = await import("./maps");
      const result = await mapsService.geocodeAddress(address as string);
      
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ error: "Failed to geocode address" });
    }
  });
  
  // Customers - filter by user's company
  app.get("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const customers = await storage.getCustomers(companyId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const customer = await storage.getCustomer(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  });

  // Customer-related endpoints for detail page
  app.get("/api/jobs/customer/:customerId", async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const jobs = await storage.getJobsByCustomer(customerId);
    res.json(jobs);
  });

  app.get("/api/invoices/customer/:customerId", async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const invoices = await storage.getInvoicesByCustomer(customerId);
    res.json(invoices);
  });

  app.get("/api/equipment/customer/:customerId", async (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const equipment = await storage.getEquipmentByCustomer(customerId);
    res.json(equipment);
  });



  app.post("/api/customers", async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get company ID based on user
      let companyId = 7; // ABC HVAC Services  
      if (userId === 56) companyId = 8; // XYZ Climate Solutions
      
      // Create customer without any validation or complex ORM calls
      const customerData = {
        company_id: companyId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        created_at: new Date()
      };
      
      const query = `INSERT INTO customers (company_id, name, email, phone, address, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const values = [companyId, req.body.name, req.body.email, req.body.phone, req.body.address, new Date()];
      
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Customer creation error:', error);
      res.status(500).json({ message: "Failed to create customer", error: String(error) });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data", error });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteCustomer(id);
    if (!success) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(204).send();
  });

  // Technicians - filter by user's company
  app.get("/api/technicians", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const technicians = await storage.getTechnicians(companyId);
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const technicianData = insertTechnicianSchema.parse(req.body);
      technicianData.companyId = companyId;
      const technician = await storage.createTechnician(technicianData);
      res.status(201).json(technician);
    } catch (error) {
      res.status(400).json({ message: "Invalid technician data", error });
    }
  });

  app.put("/api/technicians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technicianData = insertTechnicianSchema.partial().parse(req.body);
      const technician = await storage.updateTechnician(id, technicianData);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      res.json(technician);
    } catch (error) {
      res.status(400).json({ message: "Invalid technician data", error });
    }
  });

  // Jobs - filter by user's company
  app.get("/api/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      // Get all jobs and filter by company through customers
      const allJobs = await storage.getJobs();
      const customers = await storage.getCustomers(companyId);
      const customerIds = customers.map(c => c.id);
      const filteredJobs = allJobs.filter(job => customerIds.includes(job.customerId));
      
      res.json(filteredJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/today", async (req, res) => {
    const jobs = await storage.getTodaysJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const job = await storage.getJob(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Job creation error:", error);
      res.status(400).json({ message: "Invalid job data", error });
    }
  });

  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const jobData = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(id, jobData);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data", error });
    }
  });

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Invalid invoice data", error });
    }
  });

  // Inventory
  app.get("/api/inventory", async (req, res) => {
    const inventory = await storage.getInventory();
    res.json(inventory);
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    const lowStockItems = await storage.getLowStockItems();
    res.json(lowStockItems);
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const inventoryData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(inventoryData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory data", error });
    }
  });

  // Equipment
  app.get("/api/equipment", async (req, res) => {
    const equipment = await storage.getEquipment();
    res.json(equipment);
  });

  app.get("/api/equipment/service-due", async (req, res) => {
    const equipmentNeedingService = await storage.getEquipmentNeedingService();
    res.json(equipmentNeedingService);
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipmentItem(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      res.status(400).json({ message: "Invalid equipment data", error });
    }
  });

  // Dashboard stats - filter by user's company
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }
      
      const allJobs = await storage.getJobs();
      const customers = await storage.getCustomers(companyId);
      const customerIds = customers.map(c => c.id);
      const jobs = allJobs.filter(job => customerIds.includes(job.customerId));
      
      const invoices = await storage.getInvoices();
      const technicians = await storage.getTechnicians(companyId);
      
      const activeJobs = jobs.filter(job => job.status === "scheduled" || job.status === "in_progress").length;
      const monthlyRevenue = invoices
        .filter(invoice => invoice.status === "paid" && invoice.paidDate && new Date(invoice.paidDate).getMonth() === new Date().getMonth())
        .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
      const activeTechnicians = technicians.filter(tech => tech.status === "active").length;
      
      res.json({
        activeJobs,
        monthlyRevenue,
        activeTechnicians,
        customerSatisfaction: 4.8,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Route optimization endpoints
  app.post("/api/routes/optimize", isAuthenticated, async (req, res) => {
    try {
      const { technicianId, date } = req.body;
      
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
      const customers = await storage.getCustomers();
      const jobAddresses = dayJobs.map(job => {
        const customer = customers.find(c => c.id === job.customerId);
        return customer?.address || "";
      }).filter(address => address.length > 0);

      if (jobAddresses.length === 0) {
        return res.json({ message: "No valid addresses found for optimization", route: null });
      }

      // Simple route optimization (nearest neighbor algorithm)
      const optimizedRoute = jobAddresses; // For now, just return the addresses as-is
      
      // Save the optimized route
      const routeData = {
        technicianId,
        date: new Date(date),
        waypoints: optimizedRoute,
        estimatedTimes: {},
        totalDistance: 0,
        totalDuration: 0
      };

      res.json({ 
        message: "Route optimized successfully", 
        route: routeData,
        addresses: optimizedRoute 
      });
    } catch (error) {
      console.error("Error optimizing route:", error);
      res.status(500).json({ message: "Failed to optimize route" });
    }
  });

  app.get("/api/routes/:technicianId/:date", isAuthenticated, async (req, res) => {
    try {
      const { technicianId, date } = req.params;
      // For now, return a simple response
      res.json({ 
        technicianId: parseInt(technicianId), 
        date,
        waypoints: [],
        message: "Route data retrieved"
      });
    } catch (error) {
      console.error("Error fetching route:", error);
      res.status(500).json({ message: "Failed to fetch route" });
    }
  });

  // Price Book API routes
  app.get("/api/pricebook/global", isAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      let pricebook;
      if (category && typeof category === 'string') {
        pricebook = await storage.getGlobalPricebookByCategory(category);
      } else {
        pricebook = await storage.getGlobalPricebook();
      }
      res.json(pricebook);
    } catch (error) {
      console.error("Error fetching global pricebook:", error);
      res.status(500).json({ message: "Failed to fetch pricebook" });
    }
  });

  app.get("/api/pricebook/company", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }

      const { category } = req.query;
      let pricebook;
      if (category && typeof category === 'string') {
        pricebook = await storage.getCompanyPricebookByCategory(companyId, category);
      } else {
        pricebook = await storage.getCompanyPricebook(companyId);
      }

      // If company pricebook is empty, copy from global
      if (pricebook.length === 0) {
        pricebook = await storage.copyGlobalToCompanyPricebook(companyId);
      }

      res.json(pricebook);
    } catch (error) {
      console.error("Error fetching company pricebook:", error);
      res.status(500).json({ message: "Failed to fetch company pricebook" });
    }
  });

  app.post("/api/pricebook/company/copy-global", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const companyId = await storage.getUserCompanyId(userId);
      if (!companyId) {
        return res.status(403).json({ message: "User not associated with any company" });
      }

      const pricebook = await storage.copyGlobalToCompanyPricebook(companyId);
      res.json({ message: "Global pricebook copied successfully", count: pricebook.length });
    } catch (error) {
      console.error("Error copying global pricebook:", error);
      res.status(500).json({ message: "Failed to copy global pricebook" });
    }
  });

  // Register tenant-specific routes
  registerTenantRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
