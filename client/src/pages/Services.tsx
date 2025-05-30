import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, DollarSign, Clock, Wrench, Edit, Trash2, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@shared/schema";

export default function Services() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("hvac");
  const { toast } = useToast();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Main catalog sections
  const catalogSections = [
    { 
      id: "hvac", 
      name: "HVAC Services", 
      description: "Air conditioning, heating, and ventilation services",
      categories: ["AC Repair", "AC Installation", "AC Maintenance", "Heating Repair", "Heating Installation", "Heating Maintenance"]
    },
    { 
      id: "operations", 
      name: "Business Operations", 
      description: "Service calls, diagnostics, and operational fees",
      categories: ["Diagnostic Fees", "Service Calls", "Emergency Services", "Travel Time"]
    },
    { 
      id: "parts", 
      name: "Parts & Materials", 
      description: "Equipment, parts, and materials catalog",
      categories: ["Equipment", "Refrigerants", "Filters", "Electrical Components"]
    }
  ];

  const getServicesForSection = (sectionId: string) => {
    const section = catalogSections.find(s => s.id === sectionId);
    if (!section) return [];
    
    return services.filter(service => 
      section.categories.includes(service.category) &&
      (searchTerm === "" || 
       service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       service.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  if (isLoading) {
    return <div>Loading catalog...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Service Catalog</h1>
          <p className="text-slate-600">Manage your services, pricing, and business operations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <ServiceForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-3 mb-6">
              {catalogSections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="text-center">
                  <div>
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-slate-500">{section.description}</div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {catalogSections.map((section) => (
              <TabsContent key={section.id} value={section.id}>
                <div className="space-y-6">
                  {section.categories.map((category) => {
                    const categoryServices = services.filter(service => 
                      service.category === category &&
                      (searchTerm === "" || 
                       service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-800">{category}</h3>
                          <Badge variant="outline">{categoryServices.length}</Badge>
                        </div>
                        {categoryServices.length > 0 ? (
                          <div className="grid gap-3">
                            {categoryServices.map((service) => (
                              <ServiceCard key={service.id} service={service} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                            <p>No services in this category yet.</p>
                            <Button variant="ghost" size="sm" className="mt-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Add {category} Service
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-slate-800">{service.name}</h3>
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
          </div>
          
          {service.description && (
            <p className="text-slate-600 text-sm mb-3">{service.description}</p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            {service.basePrice && (
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                ${service.basePrice}
              </div>
            )}
            {service.estimatedDuration && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {service.estimatedDuration} min
              </div>
            )}
            {service.equipmentNeeded && service.equipmentNeeded.length > 0 && (
              <div className="flex items-center">
                <Wrench className="w-4 h-4 mr-1" />
                {service.equipmentNeeded.length} items
              </div>
            )}
          </div>
          
          {service.equipmentNeeded && service.equipmentNeeded.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">Equipment needed:</p>
              <div className="flex flex-wrap gap-1">
                {service.equipmentNeeded.slice(0, 3).map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
                {service.equipmentNeeded.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{service.equipmentNeeded.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ServiceForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "AC Repair",
    description: "",
    basePrice: "",
    estimatedDuration: "",
    equipmentNeeded: "",
    partsNeeded: ""
  });
  const { toast } = useToast();

  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/services", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          basePrice: data.basePrice ? parseFloat(data.basePrice) : null,
          estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration) : null,
          equipmentNeeded: data.equipmentNeeded ? data.equipmentNeeded.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          partsNeeded: data.partsNeeded ? data.partsNeeded.split(",").map((s: string) => s.trim()).filter(Boolean) : []
        }),
        headers: { "Content-Type": "application/json" }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service added successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to add service", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createServiceMutation.mutate(formData);
  };

  const categories = [
    "AC Repair", "AC Installation", "AC Maintenance",
    "Heating Repair", "Heating Installation", "Heating Maintenance",
    "Diagnostic Fees", "Service Calls", "Emergency Services", "Travel Time",
    "Equipment", "Refrigerants", "Filters", "Electrical Components"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter service name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full p-2 border border-slate-300 rounded-md"
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Service description..."
          className="w-full p-2 border border-slate-300 rounded-md"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Base Price ($)</label>
          <Input
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <Input
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            placeholder="60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Equipment Needed</label>
        <Input
          value={formData.equipmentNeeded}
          onChange={(e) => setFormData(prev => ({ ...prev, equipmentNeeded: e.target.value }))}
          placeholder="Multimeter, Gauges, Tools (comma separated)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Parts Needed</label>
        <Input
          value={formData.partsNeeded}
          onChange={(e) => setFormData(prev => ({ ...prev, partsNeeded: e.target.value }))}
          placeholder="Filters, Refrigerant, Fuses (comma separated)"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={createServiceMutation.isPending}>
          {createServiceMutation.isPending ? "Adding..." : "Add Service"}
        </Button>
      </div>
    </form>
  );
}