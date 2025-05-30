import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, MapPin } from "lucide-react";
import CustomerForm from "@/components/forms/CustomerForm";
import { queryClient } from "@/lib/queryClient";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

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
                placeholder="Search customers..."
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
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? "No customers found matching your search." : "No customers added yet."}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{customer.name}</h3>
                      <div className="mt-2 space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {customer.address}
                            {customer.city && `, ${customer.city}`}
                            {customer.state && `, ${customer.state}`}
                            {customer.zipCode && ` ${customer.zipCode}`}
                          </div>
                        )}
                      </div>
                      {customer.notes && (
                        <p className="mt-2 text-sm text-slate-500">{customer.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Jobs
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
