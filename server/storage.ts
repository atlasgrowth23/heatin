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

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private customers: Map<number, Customer> = new Map();
  private technicians: Map<number, Technician> = new Map();
  private jobs: Map<number, Job> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private invoiceItems: Map<number, InvoiceItem> = new Map();
  private inventory: Map<number, Inventory> = new Map();
  private equipment: Map<number, Equipment> = new Map();
  
  private currentUserId = 1;
  private currentCustomerId = 1;
  private currentTechnicianId = 1;
  private currentJobId = 1;
  private currentInvoiceId = 1;
  private currentInvoiceItemId = 1;
  private currentInventoryId = 1;
  private currentEquipmentId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123",
      name: "John Davis",
      email: "admin@hvacpro.com",
      role: "admin"
    };
    this.users.set(adminUser.id, adminUser);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser, id: this.currentUserId++ };
    this.users.set(user.id, user);
    return user;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customer: Customer = { 
      ...insertCustomer, 
      id: this.currentCustomerId++,
      createdAt: new Date()
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updateData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values());
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const technician: Technician = { ...insertTechnician, id: this.currentTechnicianId++ };
    this.technicians.set(technician.id, technician);
    return technician;
  }

  async updateTechnician(id: number, updateData: Partial<InsertTechnician>): Promise<Technician | undefined> {
    const technician = this.technicians.get(id);
    if (!technician) return undefined;
    
    const updatedTechnician = { ...technician, ...updateData };
    this.technicians.set(id, updatedTechnician);
    return updatedTechnician;
  }

  async deleteTechnician(id: number): Promise<boolean> {
    return this.technicians.delete(id);
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByCustomer(customerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.customerId === customerId);
  }

  async getJobsByTechnician(technicianId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.technicianId === technicianId);
  }

  async getTodaysJobs(): Promise<Job[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return Array.from(this.jobs.values()).filter(job => {
      if (!job.scheduledDate) return false;
      const scheduledDate = new Date(job.scheduledDate);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const job: Job = { 
      ...insertJob, 
      id: this.currentJobId++,
      createdAt: new Date()
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...updateData };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.customerId === customerId);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoice: Invoice = { 
      ...insertInvoice, 
      id: this.currentInvoiceId++,
      createdAt: new Date()
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...updateData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const item: InvoiceItem = { ...insertItem, id: this.currentInvoiceItemId++ };
    this.invoiceItems.set(item.id, item);
    return item;
  }

  async updateInvoiceItem(id: number, updateData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const item = this.invoiceItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updateData };
    this.invoiceItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const item: Inventory = { ...insertItem, id: this.currentInventoryId++ };
    this.inventory.set(item.id, item);
    return item;
  }

  async updateInventoryItem(id: number, updateData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updateData };
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventory.delete(id);
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(item => item.quantity <= item.minQuantity);
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }

  async getEquipmentByCustomer(customerId: number): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(eq => eq.customerId === customerId);
  }

  async createEquipmentItem(insertEquipment: InsertEquipment): Promise<Equipment> {
    const equipment: Equipment = { ...insertEquipment, id: this.currentEquipmentId++ };
    this.equipment.set(equipment.id, equipment);
    return equipment;
  }

  async updateEquipmentItem(id: number, updateData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const equipment = this.equipment.get(id);
    if (!equipment) return undefined;
    
    const updatedEquipment = { ...equipment, ...updateData };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }

  async deleteEquipmentItem(id: number): Promise<boolean> {
    return this.equipment.delete(id);
  }

  async getEquipmentNeedingService(): Promise<Equipment[]> {
    const today = new Date();
    return Array.from(this.equipment.values()).filter(eq => {
      if (!eq.nextServiceDate) return false;
      return new Date(eq.nextServiceDate) <= today;
    });
  }
}

export const storage = new MemStorage();
