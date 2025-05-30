import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, User, Search, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, GlobalPricebook, CompanyPricebook } from "@shared/schema";

interface JobFormNewProps {
  onSuccess?: () => void;
}

interface SelectedService {
  id: number;
  sku: string;
  taskName: string;
  standardPrice: string;
  membershipPrice?: string;
  afterHoursPrice?: string;
  estHours?: string;
  customerDescription?: string;
  equipmentType?: string;
  category: string;
}

export default function JobFormNew({ onSuccess }: JobFormNewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [customerType, setCustomerType] = useState<"standard" | "membership" | "after_hours">("standard");
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showServicePreview, setShowServicePreview] = useState(false);

  // Data queries
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: pricebook = [] } = useQuery<CompanyPricebook[]>({
    queryKey: ["/api/pricebook/company"],
  });

  // Filter services based on search
  const filteredServices = pricebook.filter(service =>
    service.taskName.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.sku.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const mainCategory = service.category.split(' > ')[0];
    if (!acc[mainCategory]) acc[mainCategory] = [];
    acc[mainCategory].push(service);
    return acc;
  }, {} as Record<string, CompanyPricebook[]>);

  // Calculate totals
  const estimatedHours = selectedServices.reduce((total, service) => 
    total + (parseFloat(service.estHours || "0")), 0
  );

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => {
      let price = parseFloat(service.standardPrice);
      if (customerType === "membership" && service.membershipPrice) {
        price = parseFloat(service.membershipPrice);
      } else if (customerType === "after_hours" && service.afterHoursPrice) {
        price = parseFloat(service.afterHoursPrice);
      }
      return total + price;
    }, 0);
  };

  const addService = (service: CompanyPricebook) => {
    const selectedService: SelectedService = {
      id: service.id,
      sku: service.sku,
      taskName: service.taskName,
      standardPrice: service.standardPrice,
      membershipPrice: service.membershipPrice || undefined,
      afterHoursPrice: service.afterHoursPrice || undefined,
      estHours: service.estHours || undefined,
      customerDescription: service.customerDescription || undefined,
      equipmentType: service.equipmentType || undefined,
      category: service.category
    };
    
    setSelectedServices(prev => [...prev, selectedService]);
    setServiceSearch("");
    
    // Auto-populate title if empty
    if (!title && selectedServices.length === 0) {
      setTitle(service.taskName);
    }
    
    // Auto-populate description
    if (service.customerDescription && !description) {
      setDescription(service.customerDescription);
    }
  };

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const getServicePrice = (service: SelectedService) => {
    if (customerType === "membership" && service.membershipPrice) {
      return parseFloat(service.membershipPrice);
    } else if (customerType === "after_hours" && service.afterHoursPrice) {
      return parseFloat(service.afterHoursPrice);
    }
    return parseFloat(service.standardPrice);
  };

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create service call: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/today"] });
      toast({
        title: "Success",
        description: "Service call created successfully",
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create service call",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerId("");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setScheduledDate("");
    setTechnicianId("");
    setSelectedServices([]);
    setServiceSearch("");
    setCustomerType("standard");
    setShowServiceSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please select a customer and at least one service",
        variant: "destructive",
      });
      return;
    }

    const servicesList = selectedServices.map(service => ({
      sku: service.sku,
      taskName: service.taskName,
      price: getServicePrice(service),
      hours: parseFloat(service.estHours || "0")
    }));

    const jobData = {
      customerId: parseInt(customerId),
      technicianId: technicianId && technicianId !== "unassigned" ? parseInt(technicianId) : undefined,
      title: title || selectedServices.map(s => s.taskName).join(", "),
      description: description || selectedServices.map(s => s.customerDescription).filter(Boolean).join(". "),
      status: "scheduled",
      priority,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      estimatedDuration: Math.round(estimatedHours * 60), // Convert to minutes
      notes: `Services: ${servicesList.map(s => `${s.sku} - ${s.taskName} ($${s.price})`).join("; ")}. Total: $${getTotalPrice().toFixed(2)}`
    };

    createJobMutation.mutate(jobData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer *</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pricing Type</Label>
          <Select value={customerType} onValueChange={(value: any) => setCustomerType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Pricing</SelectItem>
              <SelectItem value="membership">Membership Pricing</SelectItem>
              <SelectItem value="after_hours">After Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Service Search and Selection */}
      <div className="space-y-3">
        <Label>Services *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search HVAC services (tune-up, filter, repair, installation)..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Service Search Results */}
        {serviceSearch && filteredServices.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {filteredServices.slice(0, 8).map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                onClick={() => addService(service)}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{service.taskName}</div>
                  <div className="text-xs text-slate-500">{service.sku} • {service.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    ${customerType === "membership" && service.membershipPrice
                      ? service.membershipPrice
                      : customerType === "after_hours" && service.afterHoursPrice
                      ? service.afterHoursPrice
                      : service.standardPrice}
                  </div>
                  {service.estHours && (
                    <div className="text-xs text-slate-400">{service.estHours}h</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Services */}
        {selectedServices.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm">Selected Services</h4>
              <div className="flex items-center text-lg font-semibold">
                <DollarSign className="mr-1 h-4 w-4" />
                {getTotalPrice().toFixed(2)}
              </div>
            </div>
            {selectedServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{service.taskName}</div>
                  <div className="text-xs text-slate-500">{service.sku}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">${getServicePrice(service).toFixed(2)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
          <Input
            id="scheduledDate"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technician">Technician (optional)</Label>
          <Select value={technicianId} onValueChange={setTechnicianId}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {technicians.map((tech: any) => (
                <SelectItem key={tech.id} value={tech.id.toString()}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Special instructions, customer requests..."
          rows={2}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={resetForm}>
          Reset
        </Button>
        <Button 
          type="submit" 
          disabled={createJobMutation.isPending || !customerId || selectedServices.length === 0}
        >
          {createJobMutation.isPending ? "Creating..." : "Create Service Call"}
        </Button>
      </div>
    </form>
  );
}