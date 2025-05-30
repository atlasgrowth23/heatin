import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, DollarSign, HardHat, Star,
  AlertTriangle, Wrench, Clock, ExternalLink 
} from "lucide-react";
import { format } from "date-fns";
import { useTenant } from "@/hooks/useTenant";
import type { Job, Customer, Technician } from "@shared/schema";

export default function Dashboard() {
  const { getApiUrl, isValidTenant } = useTenant();

  const { data: stats = {
    activeJobs: 0,
    monthlyRevenue: 0,
    activeTechnicians: 0,
    customerSatisfaction: 4.8
  }, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: todayJobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/today"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: [getApiUrl("/customers")],
    enabled: isValidTenant,
    queryFn: async () => {
      const response = await fetch(getApiUrl("/customers"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: [getApiUrl("/technicians")],
    enabled: isValidTenant,
    queryFn: async () => {
      const response = await fetch(getApiUrl("/technicians"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch technicians");
      return response.json();
    },
  });

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getTechnicianName = (technicianId: number | null) => {
    if (!technicianId) return "Unassigned";
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.name || "Unknown Technician";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (statsLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Jobs</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {stats.activeJobs || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <span className="inline-flex items-center">
                    ↗ 12% from last week
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="text-blue-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Revenue (Month)</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  ${stats.monthlyRevenue?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <span className="inline-flex items-center">
                    ↗ 8% from last month
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Technicians</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {stats?.activeTechnicians || 0}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <span className="text-green-600">{stats?.activeTechnicians || 0} active</span> • 
                  <span className="text-slate-500 ml-1">
                    {(technicians.length || 0) - (stats?.activeTechnicians || 0)} off
                  </span>
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <HardHat className="text-orange-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {stats?.customerSatisfaction || "4.8"}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  <Star className="inline w-4 h-4 mr-1" />
                  From 47 reviews
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="text-yellow-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobsLoading ? (
                <div>Loading today's jobs...</div>
              ) : todayJobs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No jobs scheduled for today
                </div>
              ) : (
                todayJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center space-x-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-12 ${getPriorityColor(job.priority)} rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-800">
                          {getCustomerName(job.customerId)}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {job.scheduledDate ? format(new Date(job.scheduledDate), "h:mm a") : "No time set"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{job.title}</p>
                      <p className="text-sm text-slate-500">{job.address || "No address"}</p>
                      <p className="text-xs text-slate-400">
                        Assigned to: {getTechnicianName(job.technicianId)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start space-x-3 h-auto p-3"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600 w-4 h-4" />
                </div>
                <span className="font-medium">Emergency Call</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-3 h-auto p-3"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="text-blue-600 w-4 h-4" />
                </div>
                <span className="font-medium">Schedule Job</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-3 h-auto p-3"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="text-green-600 w-4 h-4" />
                </div>
                <span className="font-medium">Add Customer</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-3 h-auto p-3"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-orange-600 w-4 h-4" />
                </div>
                <span className="font-medium">Create Invoice</span>
              </Button>
            </CardContent>
          </Card>

          {/* Equipment Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Equipment Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <Wrench className="text-yellow-600 mt-1 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Service Due</p>
                  <p className="text-xs text-slate-600">Wilson AC Unit #A123</p>
                  <p className="text-xs text-yellow-700">Due in 3 days</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="text-red-600 mt-1 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Low Inventory</p>
                  <p className="text-xs text-slate-600">R-410A Refrigerant</p>
                  <p className="text-xs text-red-700">Only 2 units left</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Clock className="text-blue-600 mt-1 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Overdue Invoice</p>
                  <p className="text-xs text-slate-600">Johnson Residence</p>
                  <p className="text-xs text-blue-700">$485.00 - 15 days overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-slate-800">Job completed at Smith Commercial</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-slate-800">New customer added: Wilson HVAC</p>
                  <p className="text-xs text-slate-500">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-slate-800">Invoice #1025 sent to Johnson Residence</p>
                  <p className="text-xs text-slate-500">6 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
