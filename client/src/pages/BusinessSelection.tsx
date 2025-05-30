import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, MapPin } from "lucide-react";

interface Business {
  id: number;
  name: string;
  slug: string;
  loginUsername: string;
}

export default function BusinessSelection() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("/api/businesses")
      .then(res => res.json())
      .then(data => {
        setBusinesses(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching businesses:", error);
        setLoading(false);
      });
  }, []);

  const handleBusinessSelect = (business: Business) => {
    // Store selected business in localStorage for the session
    localStorage.setItem("selectedBusiness", JSON.stringify(business));
    // Redirect to login with business context
    setLocation(`/login?business=${business.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Select Your Business
          </h1>
          <p className="text-xl text-slate-600">
            Choose your HVAC business to access your management dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {businesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {business.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>
                      {business.id === 4 ? "1 Technician" : 
                       business.id === 5 ? "2 Technicians" : 
                       "3 Technicians"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>
                      {business.id === 4 ? "Austin, TX" :
                       business.id === 5 ? "Dallas, TX" :
                       "Houston, TX"}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => handleBusinessSelect(business)}
                >
                  Access Dashboard
                </Button>
                
                <div className="mt-3 text-xs text-slate-500 text-center">
                  Login: {business.loginUsername} / demo123
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Each business operates independently with separate customer data, technicians, and jobs.
          </p>
        </div>
      </div>
    </div>
  );
}