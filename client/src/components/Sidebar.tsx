import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";
import { 
  BarChart3, Users, Calendar, ClipboardList, 
  FileText, Package, HardHat, TrendingUp, Wrench, Settings 
} from "lucide-react";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const getNavigation = (businessSlug: string | undefined) => [
  { name: "Dashboard", href: businessSlug ? `/${businessSlug}` : "/", icon: BarChart3 },
  { name: "Customers", href: businessSlug ? `/${businessSlug}/customers` : "/customers", icon: Users },
  { name: "Scheduling", href: businessSlug ? `/${businessSlug}/scheduling` : "/scheduling", icon: Calendar },
  { name: "Service Calls", href: businessSlug ? `/${businessSlug}/service-calls` : "/service-calls", icon: ClipboardList },
  { name: "Invoicing", href: businessSlug ? `/${businessSlug}/invoicing` : "/invoicing", icon: FileText },
  { name: "Inventory", href: businessSlug ? `/${businessSlug}/inventory` : "/inventory", icon: Package },
  { name: "Technicians", href: businessSlug ? `/${businessSlug}/technicians` : "/technicians", icon: HardHat },
  { name: "Reports", href: businessSlug ? `/${businessSlug}/reports` : "/reports", icon: TrendingUp },
  { name: "Settings", href: businessSlug ? `/${businessSlug}/settings` : "/settings", icon: Settings },
];

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();
  const { businessSlug } = useTenant();
  const navigation = getNavigation(businessSlug);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-slate-200 hidden lg:block">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wrench className="text-primary-foreground w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-slate-800">HVACPro</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <div className="mb-6">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">John Davis</p>
                <p className="text-xs text-primary">Admin</p>
              </div>
            </div>
          </div>

          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-slate-600 hover:bg-slate-100"
                )}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full bg-white">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Wrench className="text-primary-foreground w-4 h-4" />
                  </div>
                  <span className="text-xl font-bold text-slate-800">HVACPro</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="text-slate-600">✕</span>
                </button>
              </div>
            </div>
            
            <nav className="p-4 space-y-2 flex-1">
              <div className="mb-6">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">JD</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">John Davis</p>
                    <p className="text-xs text-primary">Admin</p>
                  </div>
                </div>
              </div>

              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
