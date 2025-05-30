import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, DollarSign, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Invoice, Customer } from "@shared/schema";

export default function Invoicing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const filteredInvoices = invoices.filter(invoice => {
    const customerName = getCustomerName(invoice.customerId);
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalRevenue = () => {
    return invoices
      .filter(invoice => invoice.status === "paid")
      .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
  };

  const getPendingAmount = () => {
    return invoices
      .filter(invoice => invoice.status === "sent" || invoice.status === "overdue")
      .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
  };

  const getOverdueAmount = () => {
    return invoices
      .filter(invoice => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
  };

  if (isLoading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Invoicing</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  ${getTotalRevenue().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-xl font-bold text-blue-600">
                  ${getPendingAmount().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-slate-600">Overdue</p>
                <p className="text-xl font-bold text-red-600">
                  ${getOverdueAmount().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Total Invoices</p>
                <p className="text-xl font-bold text-slate-800">
                  {invoices.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardContent className="p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm || statusFilter !== "all" 
                ? "No invoices found matching your filters." 
                : "No invoices created yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-800">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 mb-2">
                        {getCustomerName(invoice.customerId)}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <div>
                          <span className="font-medium">Amount:</span> ${parseFloat(invoice.total).toLocaleString()}
                        </div>
                        
                        {invoice.createdAt && (
                          <div>
                            <span className="font-medium">Created:</span> {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                          </div>
                        )}
                        
                        {invoice.dueDate && (
                          <div>
                            <span className="font-medium">Due:</span> {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                          </div>
                        )}
                        
                        {invoice.paidDate && (
                          <div className="text-green-600">
                            <span className="font-medium">Paid:</span> {format(new Date(invoice.paidDate), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      {invoice.status === "draft" && (
                        <Button variant="outline" size="sm">
                          Send
                        </Button>
                      )}
                      {(invoice.status === "sent" || invoice.status === "overdue") && (
                        <Button variant="outline" size="sm">
                          Mark Paid
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
