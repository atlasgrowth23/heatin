import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Clock, User, MapPin, Plus, Play, Pause, CheckCircle, Edit, MoreVertical, Timer } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import JobFormNew from "@/components/forms/JobFormNew";
import ServiceCallDetailDrawer from "@/components/ServiceCallDetailDrawer";
import type { Job, Customer } from "@shared/schema";

export default function ServiceCalls() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Update job status mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: number; updates: any }) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update job");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Success", description: "Service call updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update service call", variant: "destructive" });
    },
  });

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const handleStatusChange = (jobId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    // Add timestamps for status changes
    if (newStatus === "in_progress") {
      updates.startedAt = new Date().toISOString();
    } else if (newStatus === "completed") {
      updates.completedDate = new Date().toISOString();
    }
    
    updateJobMutation.mutate({ jobId, updates });
  };

  const startTimer = (jobId: number) => {
    handleStatusChange(jobId, "in_progress");
  };

  const completeJob = (jobId: number) => {
    handleStatusChange(jobId, "completed");
  };

  const filteredJobs = jobs.filter(job => {
    const customerName = getCustomerName(job.customerId);
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div>Loading service calls...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Service Calls</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Service Call
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Service Call</DialogTitle>
            </DialogHeader>
            <JobFormNew onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search service calls..."
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {jobs.filter(j => j.status === "scheduled").length}
            </div>
            <div className="text-sm text-slate-600">Scheduled</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter(j => j.status === "in_progress").length}
            </div>
            <div className="text-sm text-slate-600">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(j => j.status === "completed").length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter(j => j.priority === "urgent").length}
            </div>
            <div className="text-sm text-slate-600">Urgent</div>
          </CardContent>
        </Card>
      </div>

      {/* Service Calls List */}
      <Card>
        <CardContent className="p-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                ? "No service calls found matching your filters." 
                : "No service calls created yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-800">
                          {getCustomerName(job.customerId)}
                        </h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 mb-2">{job.title}</p>
                      
                      {job.description && (
                        <p className="text-sm text-slate-500 mb-3">{job.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        {job.scheduledDate && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(new Date(job.scheduledDate), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {job.technicianId ? "Assigned" : "Unassigned"}
                        </div>
                        
                        {job.address && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.address}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      {job.status === "scheduled" && (
                        <Button
                          size="sm"
                          onClick={() => startTimer(job.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {job.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={() => completeJob(job.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingJob(job)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, "scheduled")}>
                            <Timer className="w-4 h-4 mr-2" />
                            Mark Scheduled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, "in_progress")}>
                            <Play className="w-4 h-4 mr-2" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, "completed")}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(job.id, "cancelled")}
                            className="text-red-600"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Cancel Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service Call</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <div className="text-sm text-slate-600 p-4">
              <p>Editing: {editingJob.title || "Service Call"}</p>
              <p>Customer: {getCustomerName(editingJob.customerId)}</p>
              <p>Status: {editingJob.status}</p>
              <p className="mt-4 text-slate-500">Edit functionality will be available soon. For now, use the quick actions to update status.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Call Detail Drawer */}
      <ServiceCallDetailDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        customers={customers}
      />
    </div>
  );
}
