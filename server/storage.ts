import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { 
  users, customers, technicians, jobs, invoices, invoiceItems, inventory, equipment,
  type User, type Customer, type Technician, type Job, type Invoice, type InvoiceItem, 
  type Inventory, type Equipment, type InsertUser, type InsertCustomer, type InsertTechnician,
  type InsertJob, type InsertInvoice, type InsertInvoiceItem, type InsertInventory, type InsertEquipment
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Technicians
  getTechnicians(): Promise<Technician[]>;
  getTechnician(id: number): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: number, technician: Partial<InsertTechnician>): Promise<Technician | undefined>;
  deleteTechnician(id: number): Promise<boolean>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobsByCustomer(customerId: number): Promise<Job[]>;
  getJobsByTechnician(technicianId: number): Promise<Job[]>;
  getTodaysJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByCustomer(customerId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Invoice Items
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  
  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  getLowStockItems(): Promise<Inventory[]>;
  
  // Equipment
  getEquipment(): Promise<Equipment[]>;
  getEquipmentItem(id: number): Promise<Equipment | undefined>;
  getEquipmentByCustomer(customerId: number): Promise<Equipment[]>;
  createEquipmentItem(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipmentItem(id: number, equipment: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipmentItem(id: number): Promise<boolean>;
  getEquipmentNeedingService(): Promise<Equipment[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(insertCustomer).returning();
    return result[0];
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians);
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
    return result[0];
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const result = await db.insert(technicians).values(insertTechnician).returning();
    return result[0];
  }

  async updateTechnician(id: number, updateData: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const result = await db.update(technicians).set(updateData).where(eq(technicians.id, id)).returning();
    return result[0];
  }

  async deleteTechnician(id: number): Promise<boolean> {
    const result = await db.delete(technicians).where(eq(technicians.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async getJobsByCustomer(customerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.customerId, customerId));
  }

  async getJobsByTechnician(technicianId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.technicianId, technicianId));
  }

  async getTodaysJobs(): Promise<Job[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return await db.select().from(jobs).where(
      and(
        gte(jobs.scheduledDate, startOfDay),
        lte(jobs.scheduledDate, endOfDay)
      )
    );
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(insertJob).returning();
    return result[0];
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(updateData).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.customerId, customerId));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(insertInvoice).returning();
    return result[0];
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(insertItem).returning();
    return result[0];
  }

  async updateInvoiceItem(id: number, updateData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const result = await db.update(invoiceItems).set(updateData).where(eq(invoiceItems.id, id)).returning();
    return result[0];
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const result = await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
    return result[0];
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const result = await db.insert(inventory).values(insertItem).returning();
    return result[0];
  }

  async updateInventoryItem(id: number, updateData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const result = await db.update(inventory).set(updateData).where(eq(inventory.id, id)).returning();
    return result[0];
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db.select().from(inventory).where(
      lte(inventory.quantity, inventory.minQuantity)
    );
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    const result = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    return result[0];
  }

  async getEquipmentByCustomer(customerId: number): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.customerId, customerId));
  }

  async createEquipmentItem(insertEquipment: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values(insertEquipment).returning();
    return result[0];
  }

  async updateEquipmentItem(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const result = await db.update(equipment).set(updateData).where(eq(equipment.id, id)).returning();
    return result[0];
  }

  async deleteEquipmentItem(id: number): Promise<boolean> {
    const result = await db.delete(equipment).where(eq(equipment.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEquipmentNeedingService(): Promise<Equipment[]> {
    const today = new Date();
    return await db.select().from(equipment).where(
      lte(equipment.nextServiceDate, today)
    );
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true));
  }

  async getService(id: number): Promise<Service | undefined> {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0];
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return await db.select().from(services).where(
      and(eq(services.category, category), eq(services.isActive, true))
    );
  }

  async createService(insertService: InsertService): Promise<Service> {
    const result = await db.insert(services).values(insertService).returning();
    return result[0];
  }

  async updateService(id: number, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db.update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();
    return result[0];
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.update(services)
      .set({ isActive: false })
      .where(eq(services.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();