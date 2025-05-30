import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import CustomerForm from "@/components/forms/CustomerForm";
import { queryClient } from "@/lib/queryClient";
import { formatPhoneNumber } from "@/lib/utils";
import { useBusiness } from "@/hooks/useBusiness";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentBusiness } = useBusiness();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", currentBusiness?.id],
    enabled: !!currentBusiness?.id,
    select: (data) => data.filter(customer => customer.companyId === currentBusiness?.id),
  });

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.city && customer.city.toLowerCase().includes(searchLower)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower)) ||
      (customer.state && customer.state.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, email, city, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {searchTerm ? "No customers found matching your search." : "No customers added yet."}
            </div>
          ) : (
            <div className="overflow-hidden">
              {filteredCustomers.map((customer, index) => (
                <div key={customer.id} className={`${index !== 0 ? 'border-t border-slate-100' : ''}`}>
                  <Link href={`/customers/${customer.id}`}>
                    <div className="p-8 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-6 flex-1">
                          {/* Customer Avatar */}
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-semibold text-xl">
                              {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          
                          {/* Customer Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 text-xl mb-3">
                              {customer.name}
                            </h3>
                            <div className="space-y-2">
                              {customer.phone && (
                                <div className="flex items-center text-sm text-slate-600">
                                  <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center text-sm text-slate-600">
                                  <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
                                  <span>{customer.email}</span>
                                </div>
                              )}
                            </div>
                            {customer.address && (
                              <div className="flex items-start text-sm text-slate-500 mt-3">
                                <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                <span className="break-words">
                                  {customer.address}{customer.city && `, ${customer.city}`}{customer.state && `, ${customer.state}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-4" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
