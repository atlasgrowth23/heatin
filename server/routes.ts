import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, insertTechnicianSchema, insertJobSchema, 
  insertInvoiceSchema, insertInventorySchema, insertEquipmentSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Customers
  app.get("/api/customers", async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const customer = await storage.getCustomer(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data", error });
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

  // Technicians
  app.get("/api/technicians", async (req, res) => {
    const technicians = await storage.getTechnicians();
    res.json(technicians);
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const technicianData = insertTechnicianSchema.parse(req.body);
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

  // Jobs
  app.get("/api/jobs", async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
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

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    const jobs = await storage.getJobs();
    const invoices = await storage.getInvoices();
    const technicians = await storage.getTechnicians();
    
    const activeJobs = jobs.filter(job => job.status === "scheduled" || job.status === "in_progress").length;
    const monthlyRevenue = invoices
      .filter(invoice => invoice.status === "paid" && invoice.paidDate && new Date(invoice.paidDate).getMonth() === new Date().getMonth())
      .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
    const activeTechnicians = technicians.filter(tech => tech.status === "active").length;
    
    res.json({
      activeJobs,
      monthlyRevenue,
      activeTechnicians,
      customerSatisfaction: 4.8, // This would come from actual reviews
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
