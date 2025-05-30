import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, DollarSign, Clock, Wrench, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@shared/schema";

export default function Services() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { toast } = useToast();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const categories = [
    "all",
    "AC Repair",
    "AC Installation", 
    "AC Maintenance",
    "Heating Repair",
    "Heating Installation",
    "Heating Maintenance",
    "Ductwork Services",
    "Emergency Services",
    "Air Quality Services"
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = categories.reduce((acc, category) => {
    if (category === "all") return acc;
    acc[category] = services.filter(service => service.category === category);
    return acc;
  }, {} as Record<string, Service[]>);

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Services</h1>
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
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-6">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category === "all" ? "All" : category.replace(" Services", "")}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4">
                {Object.entries(groupedServices).map(([category, categoryServices]) => 
                  categoryServices.length > 0 && (
                    <div key={category}>
                      <h3 className="font-semibold text-slate-700 mb-3">{category}</h3>
                      <div className="grid gap-3 mb-6">
                        {categoryServices.map((service) => (
                          <ServiceCard key={service.id} service={service} />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </TabsContent>

            {categories.slice(1).map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-3">
                  {groupedServices[category]?.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                  {(!groupedServices[category] || groupedServices[category].length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      No services in this category yet.
                    </div>
                  )}
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
  // We'll implement this form component next
  return (
    <div className="p-4 text-center text-slate-500">
      Service form will be implemented next
    </div>
  );
}