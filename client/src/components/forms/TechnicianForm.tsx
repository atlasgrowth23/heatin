import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertTechnicianSchema } from "@shared/schema";
import type { InsertTechnician } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TechnicianFormProps {
  onSuccess?: () => void;
}

const commonSpecialties = [
  "Air Conditioning", "Heating", "Ventilation", "Refrigeration", 
  "Electrical", "Plumbing", "Ductwork", "Maintenance", 
  "Installation", "Repair", "Emergency Service"
];

export default function TechnicianForm({ onSuccess }: TechnicianFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");

  const form = useForm<InsertTechnician>({
    resolver: zodResolver(insertTechnicianSchema),
    defaultValues: {
      userId: undefined,
      name: "",
      email: "",
      phone: "",
      specialties: [],
      status: "active",
      hourlyRate: undefined,
    },
  });

  const createTechnicianMutation = useMutation({
    mutationFn: async (data: InsertTechnician) => {
      console.log("Making API request with data:", { ...data, specialties });
      
      try {
        const response = await fetch("/api/technicians", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...data,
            specialties,
          }),
        });

        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API success response:", result);
        return result;
      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Mutation success:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({
        title: "Success",
        description: "Technician created successfully",
      });
      form.reset();
      setSpecialties([]);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create technician",
        variant: "destructive",
      });
    },
  });

  const addSpecialty = (specialty: string) => {
    if (specialty && !specialties.includes(specialty)) {
      setSpecialties([...specialties, specialty]);
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const onSubmit = async (data: InsertTechnician) => {
    console.log("Technician form submitted with data:", data);
    console.log("Specialties:", specialties);
    
    setIsSubmitting(true);
    try {
      console.log("Attempting to create technician...");
      await createTechnicianMutation.mutateAsync(data);
      console.log("Technician created successfully");
    } catch (error) {
      console.error("Error creating technician:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technician Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter technician name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="off">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="technician@example.com" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="25.00" 
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Specialties Section */}
        <div className="space-y-4">
          <FormLabel>Specialties</FormLabel>
          
          {/* Current Specialties */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                  {specialty}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeSpecialty(specialty)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Add Specialty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select onValueChange={addSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from common specialties" />
                </SelectTrigger>
                <SelectContent>
                  {commonSpecialties
                    .filter(specialty => !specialties.includes(specialty))
                    .map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Or add custom specialty"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecialty(newSpecialty);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSpecialty(newSpecialty)}
                disabled={!newSpecialty}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setSpecialties([]);
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Technician"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
