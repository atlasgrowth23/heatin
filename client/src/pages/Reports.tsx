import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, DollarSign, Users, ClipboardList, Calendar,
  Download, Filter, CalendarRange
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useState } from "react";
import type { Job, Invoice, Customer, Technician } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case "7":
        return { start: subDays(today, 7), end: today };
      case "30":
        return { start: subDays(today, 30), end: today };
      case "90":
        return { start: subDays(today, 90), end: today };
      case "month":
        return { start: startOfMonth(today), end: endOfMonth(today) };
      default:
        return { start: subDays(today, 30), end: today };
    }
  };

  const { start, end } = getDateRange();

  // Filter data by date range
  const filteredJobs = jobs.filter(job => {
    if (!job.createdAt) return false;
    const jobDate = new Date(job.createdAt);
    return jobDate >= start && jobDate <= end;
  });

  const filteredInvoices = invoices.filter(invoice => {
    if (!invoice.createdAt) return false;
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= start && invoiceDate <= end;
  });

  // Revenue data for chart
  const revenueData = eachDayOfInterval({ start, end }).map(date => {
    const dayInvoices = invoices.filter(invoice => {
      if (!invoice.paidDate) return false;
      const paidDate = new Date(invoice.paidDate);
      return paidDate.toDateString() === date.toDateString();
    });
    
    const revenue = dayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
    
    return {
      date: format(date, "MMM dd"),
      revenue,
      jobs: jobs.filter(job => {
        if (!job.completedDate) return false;
        const completedDate = new Date(job.completedDate);
        return completedDate.toDateString() === date.toDateString();
      }).length
    };
  });

  // Job status distribution
  const jobStatusData = [
    { name: "Scheduled", value: jobs.filter(j => j.status === "scheduled").length, color: "#3B82F6" },
    { name: "In Progress", value: jobs.filter(j => j.status === "in_progress").length, color: "#F59E0B" },
    { name: "Completed", value: jobs.filter(j => j.status === "completed").length, color: "#10B981" },
    { name: "Cancelled", value: jobs.filter(j => j.status === "cancelled").length, color: "#EF4444" },
  ];

  // Calculate KPIs
  const totalRevenue = filteredInvoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);

  const completedJobs = filteredJobs.filter(job => job.status === "completed").length;
  const averageJobValue = completedJobs > 0 ? totalRevenue / completedJobs : 0;

  const newCustomers = customers.filter(customer => {
    if (!customer.createdAt) return false;
    const customerDate = new Date(customer.createdAt);
    return customerDate >= start && customerDate <= end;
  }).length;

  // Technician performance
  const technicianPerformance = technicians.map(tech => {
    const techJobs = filteredJobs.filter(job => job.technicianId === tech.id);
    const completedTechJobs = techJobs.filter(job => job.status === "completed");
    
    return {
      name: tech.name,
      jobs: techJobs.length,
      completed: completedTechJobs.length,
      completionRate: techJobs.length > 0 ? (completedTechJobs.length / techJobs.length) * 100 : 0
    };
  }).sort((a, b) => b.completed - a.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="jobs">Jobs</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                  +12% from last period
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
                <p className="text-sm font-medium text-slate-600">Completed Jobs</p>
                <p className="text-3xl font-bold text-blue-600">
                  {completedJobs}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                  +8% completion rate
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
                <p className="text-sm font-medium text-slate-600">New Customers</p>
                <p className="text-3xl font-bold text-purple-600">
                  {newCustomers}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                  +15% growth
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Job Value</p>
                <p className="text-3xl font-bold text-orange-600">
                  ${averageJobValue.toLocaleString()}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                  +5% from average
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${value}` : value,
                    name === 'revenue' ? 'Revenue' : 'Jobs'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Technician Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technicianPerformance.slice(0, 5).map((tech, index) => (
              <div key={tech.name} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">{tech.name}</h4>
                    <p className="text-sm text-slate-500">
                      {tech.completed} of {tech.jobs} jobs completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-800">{tech.completed}</p>
                    <p className="text-sm text-slate-500">Completed</p>
                  </div>
                  <Badge className={
                    tech.completionRate >= 90 ? "bg-green-100 text-green-800" :
                    tech.completionRate >= 75 ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {tech.completionRate.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs Completed Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jobs" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
