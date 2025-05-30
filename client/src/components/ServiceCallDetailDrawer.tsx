import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Camera, 
  Clock, 
  MapPin, 
  User, 
  DollarSign,
  Upload,
  Pin,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Job, Customer } from "@shared/schema";

interface ServiceCallDetailDrawerProps {
  job: Job | null;
  onClose: () => void;
  customers: Customer[];
}

export default function ServiceCallDetailDrawer({ 
  job, 
  onClose, 
  customers 
}: ServiceCallDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingSymptom, setEditingSymptom] = useState(false);
  const [symptomText, setSymptomText] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isCustomerFacing, setIsCustomerFacing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!job) return null;

  const customer = customers.find(c => c.id === job.customerId);

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/jobs/${job.id}`, {
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
      toast({ title: "Success", description: "Service call updated" });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateJobMutation.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: string) => {
    updateJobMutation.mutate({ priority: newPriority });
  };

  const saveSymptom = () => {
    updateJobMutation.mutate({ description: symptomText });
    setEditingSymptom(false);
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
      case "emergency": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Sheet open={!!job} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-none">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Service Call #{job.id}</span>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(job.status)}>
                {job.status.replace("_", " ")}
              </Badge>
              <Badge className={getPriorityColor(job.priority)}>
                {job.priority}
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="lineitems">Line Items</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{customer?.name || "Unknown Customer"}</span>
                  </div>
                  {customer?.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">{customer.phone}</span>
                    </div>
                  )}
                  {customer?.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">{customer.address}</span>
                    </div>
                  )}
                  {job.scheduledDate && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {format(new Date(job.scheduledDate), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status & Priority Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={job.status} onValueChange={handleStatusChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={job.priority} onValueChange={handlePriorityChange}>
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
                  </div>
                </CardContent>
              </Card>

              {/* Symptom/Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Symptoms & Description
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingSymptom(!editingSymptom);
                        setSymptomText(job.description || "");
                      }}
                    >
                      {editingSymptom ? "Cancel" : "Edit"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingSymptom ? (
                    <div className="space-y-3">
                      <Textarea
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                        placeholder="Describe the customer's issue and symptoms..."
                        rows={4}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={saveSymptom} size="sm">
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingSymptom(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700">
                      {job.description || "No symptoms or description provided yet."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customerFacing"
                      checked={isCustomerFacing}
                      onChange={(e) => setIsCustomerFacing(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="customerFacing" className="flex items-center space-x-1">
                      {isCustomerFacing ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span>Customer-facing note (appears on invoice)</span>
                    </Label>
                  </div>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={
                      isCustomerFacing 
                        ? "Write a note that will be visible to the customer..."
                        : "Internal note for tech and office communication..."
                    }
                    rows={3}
                  />
                  <Button 
                    onClick={() => {
                      // TODO: Implement note saving
                      toast({ title: "Note saved", description: "Note functionality will be implemented next" });
                      setNewNote("");
                    }}
                    disabled={!newNote.trim()}
                  >
                    Add Note
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Note History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 text-center py-8">
                    No notes yet. Add the first note above.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photos & Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Camera className="h-6 w-6 mb-2" />
                      Take Photo
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Upload className="h-6 w-6 mb-2" />
                      Upload File
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center py-8 text-slate-500">
                    No photos uploaded yet. Use the buttons above to add photos.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Line Items Tab */}
            <TabsContent value="lineitems" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Quote & Line Items
                    <Button size="sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Add Service
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 text-center py-8">
                    No line items added yet. Click "Add Service" to build the quote.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Service call created</p>
                        <p className="text-xs text-slate-500">
                          {job.createdAt ? format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a") : "Just now"}
                        </p>
                      </div>
                    </div>
                    
                    {job.scheduledDate && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Appointment scheduled</p>
                          <p className="text-xs text-slate-500">
                            For {format(new Date(job.scheduledDate), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}