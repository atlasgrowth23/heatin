import { createContext, useContext, useState, ReactNode } from "react";

interface BusinessFilterContextType {
  selectedBusinessId: number | null;
  setSelectedBusinessId: (id: number) => void;
}

const BusinessFilterContext = createContext<BusinessFilterContextType | undefined>(undefined);

export function useBusinessFilter() {
  const context = useContext(BusinessFilterContext);
  if (!context) {
    throw new Error("useBusinessFilter must be used within BusinessFilterProvider");
  }
  return context;
}

interface BusinessFilterProviderProps {
  children: ReactNode;
}

export function BusinessFilterProvider({ children }: BusinessFilterProviderProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(4); // Default to Quick Fix HVAC

  return (
    <BusinessFilterContext.Provider value={{
      selectedBusinessId,
      setSelectedBusinessId
    }}>
      {children}
    </BusinessFilterContext.Provider>
  );
}