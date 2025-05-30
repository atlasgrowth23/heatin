import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, MapPin, Route, Navigation } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Customer, Technician } from "@shared/schema";

export default function Scheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [mapView, setMapView] = useState<"schedule" | "map">("schedule");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const queryClient = useQueryClient();
  
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  // Route optimization mutation
  const optimizeRoute = useMutation({
    mutationFn: async (data: { technicianId: number; date: string }) => {
      return await apiRequest({
        url: "/api/routes/optimize",
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  // Initialize Google Maps
  useEffect(() => {
    if (mapView === "map" && mapRef.current && !mapInstanceRef.current) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    }
  }, [mapView]);

  const initializeMap = () => {
    if (!mapRef.current || !(window as any).google) return;

    const google = (window as any).google;
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 39.8283, lng: -98.5795 }, // Center of US
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    // Add markers for today's jobs
    const todaysJobs = getJobsForDate(selectedDate);
    todaysJobs.forEach((job) => {
      const customer = customers.find(c => c.id === job.customerId);
      if (customer && customer.latitude && customer.longitude) {
        new google.maps.Marker({
          position: { lat: customer.latitude, lng: customer.longitude },
          map: mapInstanceRef.current,
          title: `${customer.name} - ${job.title}`,
        });
      }
    });
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getTechnicianName = (technicianId: number | null) => {
    if (!technicianId) return "Unassigned";
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.name || "Unknown";
  };

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => 
      job.scheduledDate && isSameDay(new Date(job.scheduledDate), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-500";
      case "high": return "border-l-orange-500";
      case "normal": return "border-l-blue-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Scheduling & Route Management</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Technician" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id.toString()}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={mapView === "schedule" ? "default" : "outline"}
              onClick={() => setMapView("schedule")}
              className="rounded-none"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button 
              variant={mapView === "map" ? "default" : "outline"}
              onClick={() => setMapView("map")}
              className="rounded-none"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Map View
            </Button>
          </div>
          <Button>
            Schedule New Job
          </Button>
        </div>
      </div>

      {/* Date Navigation and Route Optimization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {mapView === "schedule" ? `Week of ${format(weekStart, "MMMM d, yyyy")}` : `Jobs for ${format(selectedDate, "MMMM d, yyyy")}`}
            </CardTitle>
            <div className="flex space-x-2">
              {mapView === "schedule" ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  >
                    Previous Day
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    Next Day
                  </Button>
                  {selectedTechnician && selectedTechnician !== "all" && (
                    <Button 
                      onClick={() => optimizeRoute.mutate({ 
                        technicianId: parseInt(selectedTechnician), 
                        date: format(selectedDate, "yyyy-MM-dd") 
                      })}
                      disabled={optimizeRoute.isPending}
                    >
                      <Route className="mr-2 h-4 w-4" />
                      {optimizeRoute.isPending ? "Optimizing..." : "Optimize Route"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conditional View: Schedule or Map */}
      {mapView === "schedule" ? (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayJobs = getJobsForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card key={day.toISOString()} className={isToday ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase">
                      {format(day, "EEE")}
                    </div>
                    <div className={`text-lg ${isToday ? "text-primary font-bold" : ""}`}>
                      {format(day, "d")}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {dayJobs.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">
                    No jobs scheduled
                  </div>
                ) : (
                  dayJobs.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors ${getPriorityColor(job.priority)}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-800 truncate">
                            {getCustomerName(job.customerId)}
                          </h4>
                          <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                            {job.status}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-slate-600 truncate">{job.title}</p>
                        
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {job.scheduledDate ? format(new Date(job.scheduledDate), "h:mm a") : "No time"}
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-500">
                          <User className="w-3 h-3 mr-1" />
                          {getTechnicianName(job.technicianId)}
                        </div>
                        
                        {job.address && (
                          <div className="flex items-center text-xs text-slate-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{job.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div 
                ref={mapRef} 
                className="w-full h-96 rounded-lg"
                style={{ minHeight: "400px" }}
              />
            </CardContent>
          </Card>
          
          {/* Jobs List for Selected Date */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getJobsForDate(selectedDate)
                  .filter(job => selectedTechnician === "all" || job.technicianId?.toString() === selectedTechnician)
                  .map((job) => (
                  <div key={job.id} className={`p-4 border-l-4 rounded-lg bg-white ${getPriorityColor(job.priority)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          <span className="text-sm font-medium">{getCustomerName(job.customerId)}</span>
                        </div>
                        <p className="text-sm text-slate-600">{job.title}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {job.scheduledDate ? format(new Date(job.scheduledDate), "h:mm a") : "No time"}
                          </div>
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {getTechnicianName(job.technicianId)}
                          </div>
                          {job.address && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{job.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Navigation className="w-4 h-4 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Jobs Summary - Only show in schedule view */}
      {mapView === "schedule" && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Jobs Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {getJobsForDate(new Date()).filter(j => j.status === "scheduled").length}
                </div>
                <div className="text-sm text-blue-600">Scheduled</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {getJobsForDate(new Date()).filter(j => j.status === "in_progress").length}
                </div>
                <div className="text-sm text-yellow-600">In Progress</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {getJobsForDate(new Date()).filter(j => j.status === "completed").length}
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {getJobsForDate(new Date()).filter(j => j.priority === "urgent").length}
                </div>
                <div className="text-sm text-red-600">Urgent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
