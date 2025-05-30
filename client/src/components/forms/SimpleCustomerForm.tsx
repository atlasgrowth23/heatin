import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SimpleCustomerFormProps {
  onSuccess?: () => void;
}

export default function SimpleCustomerForm({ onSuccess }: SimpleCustomerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.statusText}`);
      }

      const customer = await response.json();
      
      // Refresh the customers list
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      // Reset form
      setFormData({ name: "", email: "", phone: "", address: "" });
      
      // Close dialog
      onSuccess?.();
      
    } catch (error) {
      console.error("Customer creation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Customer Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter customer name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="customer@example.com"
        />
      </div>
      
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
      
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setFormData({ name: "", email: "", phone: "", address: "" })}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.name.trim()}
        >
          {isSubmitting ? "Creating..." : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}