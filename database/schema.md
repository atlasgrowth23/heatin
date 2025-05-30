# HVAC Contractor Management Platform - Database Schema

## Overview
Multi-tenant HVAC contractor management system with PostgreSQL database.

## Core Tables

### companies
- **id**: serial PRIMARY KEY
- **name**: varchar NOT NULL (e.g., "ABC HVAC Services")
- **slug**: varchar UNIQUE NOT NULL (e.g., "abc-hvac")
- **address**: varchar
- **city**: varchar
- **state**: varchar
- **zipCode**: varchar
- **phone**: varchar
- **email**: varchar
- **settings**: jsonb (timezone, preferences)
- **createdAt**: timestamp DEFAULT now()

### users
- **id**: serial PRIMARY KEY
- **username**: varchar UNIQUE NOT NULL
- **password**: varchar NOT NULL (bcrypt hashed)
- **name**: varchar NOT NULL
- **email**: varchar
- **role**: varchar DEFAULT 'technician' (admin, technician, dispatcher)
- **createdAt**: timestamp DEFAULT now()

### user_roles
- **id**: serial PRIMARY KEY
- **userId**: integer REFERENCES users(id)
- **companyId**: integer REFERENCES companies(id)
- **role**: varchar NOT NULL
- **createdAt**: timestamp DEFAULT now()

### customers
- **id**: serial PRIMARY KEY
- **companyId**: integer NOT NULL REFERENCES companies(id)
- **userId**: integer REFERENCES users(id)
- **name**: varchar NOT NULL
- **email**: varchar
- **phone**: varchar
- **address**: varchar
- **city**: varchar
- **state**: varchar
- **zipCode**: varchar
- **latitude**: decimal(10,8)
- **longitude**: decimal(11,8)
- **notes**: text
- **createdAt**: timestamp DEFAULT now()

### technicians
- **id**: serial PRIMARY KEY
- **companyId**: integer NOT NULL REFERENCES companies(id)
- **userId**: integer REFERENCES users(id)
- **name**: varchar NOT NULL
- **email**: varchar
- **phone**: varchar
- **specialties**: text[] (array of specialties)
- **status**: varchar DEFAULT 'active' (active, inactive, off)
- **hourlyRate**: decimal(8,2)

### jobs
- **id**: serial PRIMARY KEY
- **companyId**: integer NOT NULL REFERENCES companies(id)
- **customerId**: integer NOT NULL REFERENCES customers(id)
- **technicianId**: integer REFERENCES technicians(id)
- **title**: varchar NOT NULL
- **description**: text
- **status**: varchar DEFAULT 'scheduled' (scheduled, in-progress, completed, cancelled)
- **priority**: varchar DEFAULT 'medium' (low, medium, high, emergency)
- **scheduledDate**: timestamp
- **completedDate**: timestamp
- **estimatedDuration**: decimal(4,2)
- **actualDuration**: decimal(4,2)
- **address**: varchar
- **notes**: text
- **createdAt**: timestamp DEFAULT now()

### invoices
- **id**: serial PRIMARY KEY
- **companyId**: integer NOT NULL REFERENCES companies(id)
- **customerId**: integer NOT NULL REFERENCES customers(id)
- **jobId**: integer REFERENCES jobs(id)
- **invoiceNumber**: varchar UNIQUE NOT NULL
- **status**: varchar DEFAULT 'pending' (pending, paid, overdue, cancelled)
- **subtotal**: decimal(10,2) NOT NULL
- **tax**: decimal(10,2) DEFAULT 0
- **total**: decimal(10,2) NOT NULL
- **dueDate**: date
- **paidDate**: date
- **notes**: text
- **createdAt**: timestamp DEFAULT now()

### invoice_items
- **id**: serial PRIMARY KEY
- **invoiceId**: integer NOT NULL REFERENCES invoices(id)
- **description**: varchar NOT NULL
- **quantity**: decimal(8,2) DEFAULT 1
- **unitPrice**: decimal(8,2) NOT NULL
- **total**: decimal(10,2) NOT NULL

### inventory
- **id**: serial PRIMARY KEY
- **companyId**: integer NOT NULL REFERENCES companies(id)
- **name**: varchar NOT NULL
- **description**: text
- **sku**: varchar
- **category**: varchar
- **quantity**: integer DEFAULT 0
- **unitPrice**: decimal(8,2)
- **supplier**: varchar
- **reorderLevel**: integer DEFAULT 0
- **unit**: varchar (each, box, gallon, etc.)

### equipment
- **id**: serial PRIMARY KEY
- **companyId**: integer NOT NULL REFERENCES companies(id)
- **customerId**: integer NOT NULL REFERENCES customers(id)
- **name**: varchar NOT NULL
- **type**: varchar (HVAC Unit, Furnace, AC Unit, etc.)
- **brand**: varchar
- **model**: varchar
- **serialNumber**: varchar
- **installDate**: date
- **warrantyExpiry**: date
- **lastServiceDate**: date
- **nextServiceDate**: date
- **notes**: text

### technician_locations
- **id**: serial PRIMARY KEY
- **technicianId**: integer NOT NULL REFERENCES technicians(id)
- **latitude**: decimal(10,8) NOT NULL
- **longitude**: decimal(11,8) NOT NULL
- **timestamp**: timestamp DEFAULT now()

### job_routes
- **id**: serial PRIMARY KEY
- **technicianId**: integer NOT NULL REFERENCES technicians(id)
- **date**: date NOT NULL
- **jobs**: integer[] (array of job IDs)
- **optimizedRoute**: jsonb
- **totalDistance**: decimal(8,2)
- **estimatedTime**: integer (minutes)
- **createdAt**: timestamp DEFAULT now()

### sessions (for authentication)
- **sid**: varchar PRIMARY KEY
- **sess**: jsonb NOT NULL
- **expire**: timestamp NOT NULL

## Key Relationships

1. **Multi-tenancy**: All core tables reference `companyId` for data isolation
2. **User Management**: Users belong to companies through `user_roles` table
3. **Service Workflow**: Customer → Job → Invoice → Payment
4. **Location Tracking**: Customers and technicians have lat/lng for routing
5. **Equipment Tracking**: Equipment belongs to customers for service history

## Indexes

- `companies(slug)` - for tenant routing
- `customers(companyId)` - for tenant isolation
- `jobs(companyId, customerId)` - for customer job lookup
- `jobs(technicianId, scheduledDate)` - for technician scheduling
- `sessions(expire)` - for session cleanup

## Sample Data Flow

1. Company created with admin user
2. Admin adds customers with addresses (geocoded)
3. Jobs scheduled for customers
4. Technicians assigned to jobs
5. Jobs completed and invoiced
6. Equipment tracked per customer
7. Routes optimized for daily schedules