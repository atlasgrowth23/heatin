import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, Users, Calendar, ClipboardList, 
  FileText, Package, HardHat, TrendingUp, Wrench 
} from "lucide-react";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Scheduling", href: "/scheduling", icon: Calendar },
  { name: "Service Calls", href: "/service-calls", icon: ClipboardList },
  { name: "Invoicing", href: "/invoicing", icon: FileText },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Technicians", href: "/technicians", icon: HardHat },
  { name: "Reports", href: "/reports", icon: TrendingUp },
];

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();

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
                <a className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-slate-600 hover:bg-slate-100"
                )}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
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
                    <a 
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </a>
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
