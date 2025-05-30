import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Phone, Mail, MapPin, Wrench, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Customer, Job, Invoice, Equipment } from "@shared/schema";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const customerId = parseInt(params?.id || "0");

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/customer", customerId],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices/customer", customerId],
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment/customer", customerId],
  });

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-800">Customer not found</h2>
        <p className="text-slate-600 mt-2">The customer you're looking for doesn't exist.</p>
      </div>
    );
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-orange-100 text-orange-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{customer.name}</h1>
          <p className="text-slate-600 mt-1">Customer since {customer.createdAt ? format(new Date(customer.createdAt), "MMMM yyyy") : "Unknown"}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Service
          </Button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {(customer.address || customer.city || customer.state) && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Address</p>
                  <div className="font-medium">
                    {customer.address && <p>{customer.address}</p>}
                    {(customer.city || customer.state || customer.zipCode) && (
                      <p>
                        {customer.city}{customer.city && customer.state && ", "}{customer.state} {customer.zipCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {customer.notes && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Notes</p>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-lg">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Jobs</span>
              <span className="font-semibold">{jobs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Equipment</span>
              <span className="font-semibold">{equipment.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Invoices</span>
              <span className="font-semibold">{invoices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Revenue</span>
              <span className="font-semibold text-green-600">
                ${invoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Service History</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>All service calls for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="text-center py-8">Loading service history...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No service history yet
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-slate-800">{job.title}</h3>
                            <Badge className={getJobStatusColor(job.status)}>
                              {job.status.replace("_", " ")}
                            </Badge>
                          </div>
                          {job.description && (
                            <p className="text-slate-600 mb-2">{job.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            {job.scheduledDate && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(job.scheduledDate), "MMM d, yyyy")}</span>
                              </span>
                            )}
                            {job.estimatedDuration && (
                              <span>{job.estimatedDuration} minutes</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Registry</CardTitle>
              <CardDescription>HVAC equipment installed at this location</CardDescription>
            </CardHeader>
            <CardContent>
              {equipmentLoading ? (
                <div className="text-center py-8">Loading equipment...</div>
              ) : equipment.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No equipment registered yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipment.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Wrench className="w-5 h-5 text-slate-400 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">{item.type}</h3>
                          {item.brand && item.model && (
                            <p className="text-slate-600">{item.brand} {item.model}</p>
                          )}
                          {item.serialNumber && (
                            <p className="text-sm text-slate-500">S/N: {item.serialNumber}</p>
                          )}
                          {item.installDate && (
                            <p className="text-sm text-slate-500">
                              Installed: {format(new Date(item.installDate), "MMM d, yyyy")}
                            </p>
                          )}
                          {item.nextServiceDate && (
                            <p className="text-sm text-orange-600">
                              Next service: {format(new Date(item.nextServiceDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>All invoices for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="text-center py-8">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No invoices yet
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-slate-800">#{invoice.invoiceNumber}</h3>
                            <Badge className={getInvoiceStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            Created: {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                          </p>
                          {invoice.dueDate && (
                            <p className="text-sm text-slate-500">
                              Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-800">${invoice.total}</p>
                          {invoice.tax !== "0.00" && (
                            <p className="text-sm text-slate-500">Tax: ${invoice.tax}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}