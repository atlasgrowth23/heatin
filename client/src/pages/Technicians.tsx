import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, User, Phone, Mail, HardHat } from "lucide-react";
import TechnicianForm from "@/components/forms/TechnicianForm";
import { useTenant } from "@/hooks/useTenant";
import type { Technician } from "@shared/schema";

export default function Technicians() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentBusiness, getApiUrl, isValidTenant } = useTenant();

  const { data: technicians = [], isLoading } = useQuery<Technician[]>({
    queryKey: [getApiUrl("/technicians"), currentBusiness?.id],
    enabled: isValidTenant,
    queryFn: async () => {
      const response = await fetch(getApiUrl("/technicians"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch technicians");
      return response.json();
    },
  });

  const filteredTechnicians = technicians.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.phone?.includes(searchTerm) ||
    tech.specialties?.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "off": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActiveTechnicians = () => {
    return technicians.filter(tech => tech.status === "active").length;
  };

  const getAverageHourlyRate = () => {
    const activeWithRates = technicians.filter(tech => 
      tech.status === "active" && tech.hourlyRate
    );
    if (activeWithRates.length === 0) return 0;
    
    const total = activeWithRates.reduce((sum, tech) => 
      sum + parseFloat(tech.hourlyRate || "0"), 0
    );
    return total / activeWithRates.length;
  };

  if (isLoading) {
    return <div>Loading technicians...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Technicians</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
            </DialogHeader>
            <TechnicianForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardHat className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Total Technicians</p>
                <p className="text-xl font-bold text-blue-600">
                  {technicians.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-xl font-bold text-green-600">
                  {getActiveTechnicians()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-slate-600">Off Duty</p>
                <p className="text-xl font-bold text-red-600">
                  {technicians.filter(tech => tech.status === "off").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-yellow-600 rounded" />
              <div>
                <p className="text-sm text-slate-600">Avg. Rate</p>
                <p className="text-xl font-bold text-yellow-600">
                  ${getAverageHourlyRate().toFixed(0)}/hr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search technicians..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Technicians List */}
      <Card>
        <CardContent className="p-6">
          {filteredTechnicians.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? "No technicians found matching your search." : "No technicians added yet."}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTechnicians.map((technician) => (
                <div
                  key={technician.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-800">{technician.name}</h3>
                        <Badge className={getStatusColor(technician.status)}>
                          {technician.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {technician.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {technician.email}
                          </div>
                        )}
                        
                        {technician.phone && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {technician.phone}
                          </div>
                        )}
                        
                        {technician.hourlyRate && (
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">Rate:</span> ${parseFloat(technician.hourlyRate).toFixed(2)}/hr
                          </div>
                        )}
                      </div>
                      
                      {technician.specialties && technician.specialties.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-slate-600 mb-1 block">Specialties:</span>
                          <div className="flex flex-wrap gap-1">
                            {technician.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        Assign Job
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
