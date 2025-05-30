import { useParams } from "wouter";
import { useMemo } from "react";

const BUSINESS_MAPPING = {
  'quick-fix-hvac': { id: 4, name: "Quick Fix HVAC" },
  'city-climate-control': { id: 5, name: "City Climate Control" },
  'metro-hvac-services': { id: 6, name: "Metro HVAC Services" }
};

export function useTenant() {
  const params = useParams();
  const businessSlug = params.businessSlug;
  
  const currentBusiness = useMemo(() => {
    if (!businessSlug || !BUSINESS_MAPPING[businessSlug as keyof typeof BUSINESS_MAPPING]) {
      return null;
    }
    return {
      slug: businessSlug,
      ...BUSINESS_MAPPING[businessSlug as keyof typeof BUSINESS_MAPPING]
    };
  }, [businessSlug]);

  const getApiUrl = (endpoint: string) => {
    if (!currentBusiness) return endpoint;
    return `/api/${currentBusiness.slug}${endpoint}`;
  };

  return {
    currentBusiness,
    businessSlug,
    getApiUrl,
    isValidTenant: !!currentBusiness
  };
}