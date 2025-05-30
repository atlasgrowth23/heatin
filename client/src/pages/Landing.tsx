import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Users, Calendar, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            HVAC Management System
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Streamline your HVAC business with comprehensive customer management, 
            job scheduling, and service tracking.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => window.location.href = "/login"}>
              Sign In to Get Started
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Keep track of all your customers, their contact information, and service history
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Job Scheduling</CardTitle>
              <CardDescription>
                Schedule and track service calls, assign technicians, and manage priorities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Wrench className="w-8 h-8 text-orange-600 mb-2" />
              <CardTitle>Service Tracking</CardTitle>
              <CardDescription>
                Monitor job status, track completion times, and maintain equipment records
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Invoicing</CardTitle>
              <CardDescription>
                Generate professional invoices and track payments for all completed jobs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}