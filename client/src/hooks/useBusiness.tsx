import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Business {
  id: number;
  name: string;
  slug: string;
}

interface BusinessContextType {
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business) => void;
  businesses: Business[];
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within BusinessProvider");
  }
  return context;
}

interface BusinessProviderProps {
  children: ReactNode;
}

export function BusinessProvider({ children }: BusinessProviderProps) {
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses] = useState<Business[]>([
    { id: 4, name: "Quick Fix HVAC", slug: "quick-fix-hvac" },
    { id: 5, name: "City Climate Control", slug: "city-climate-control" },
    { id: 6, name: "Metro HVAC Services", slug: "metro-hvac-services" }
  ]);

  useEffect(() => {
    // Load saved business from localStorage
    const saved = localStorage.getItem("currentBusiness");
    if (saved) {
      try {
        const business = JSON.parse(saved);
        setCurrentBusiness(business);
      } catch (error) {
        // Default to first business if parsing fails
        setCurrentBusiness(businesses[0]);
      }
    } else {
      // Default to first business
      setCurrentBusiness(businesses[0]);
    }
  }, []);

  const handleSetBusiness = (business: Business) => {
    setCurrentBusiness(business);
    localStorage.setItem("currentBusiness", JSON.stringify(business));
  };

  return (
    <BusinessContext.Provider value={{
      currentBusiness,
      setCurrentBusiness: handleSetBusiness,
      businesses
    }}>
      {children}
    </BusinessContext.Provider>
  );
}