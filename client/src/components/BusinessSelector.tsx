import { useBusiness } from "@/hooks/useBusiness";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check } from "lucide-react";

export default function BusinessSelector() {
  const { currentBusiness, setCurrentBusiness, businesses } = useBusiness();

  if (!currentBusiness) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">{currentBusiness.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onClick={() => setCurrentBusiness(business)}
            className="flex items-center justify-between"
          >
            <span>{business.name}</span>
            {currentBusiness.id === business.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}