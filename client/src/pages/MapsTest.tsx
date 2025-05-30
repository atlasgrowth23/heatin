import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function MapsTest() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testGeocoding = async () => {
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Please enter an address to test",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to geocode: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Success",
        description: "Address geocoded successfully",
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to geocode address",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Google Maps API Test</h1>
        <p className="text-slate-600">Test geocoding functionality with your Google Maps API key</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Address Geocoding Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter address (e.g., 1600 Amphitheatre Parkway, Mountain View, CA)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={testGeocoding}
              disabled={isLoading}
            >
              {isLoading ? "Testing..." : "Test Geocoding"}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Geocoding Result:</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Formatted Address:</strong> {result.formattedAddress}</div>
                <div><strong>Latitude:</strong> {result.latitude}</div>
                <div><strong>Longitude:</strong> {result.longitude}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}