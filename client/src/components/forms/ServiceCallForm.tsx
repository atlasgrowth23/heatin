import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceCallFormProps {
  onSuccess?: () => void;
}

export default function ServiceCallForm({ onSuccess }: ServiceCallFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      console.log("Creating service call with data:", jobData);
      
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(jobData),
      });

      console.log("Service call creation response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Service call creation error:", errorText);
        throw new Error(`Failed to create service call: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Service call created successfully:", result);
      return result;
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
      console.error("Service call creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service call",
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
    setEstimatedHours("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");

    if (!customerId || !title) {
      toast({
        title: "Error",
        description: "Please select a customer and enter a service title",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const jobData = {
        customerId: parseInt(customerId),
        title,
        description,
        status: "scheduled",
        priority,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        estimatedDuration: estimatedHours ? parseFloat(estimatedHours) : null,
        technicianId: null,
      };

      await createJobMutation.mutateAsync(jobData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <Label htmlFor="title">Service Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., AC Repair, Heating Maintenance"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the service needed..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="2.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled Date</Label>
          <Input
            id="scheduledDate"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={resetForm}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Service Call"}
        </Button>
      </div>
    </form>
  );
}