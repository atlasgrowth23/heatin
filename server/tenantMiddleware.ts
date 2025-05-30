import { RequestHandler } from "express";
import { storage } from "./storage";

// Middleware to extract and validate tenant from URL
export const extractTenant: RequestHandler = async (req, res, next) => {
  const slug = req.params.slug;
  
  if (!slug) {
    return res.status(400).json({ message: "Tenant slug required" });
  }

  try {
    // Map slugs to company IDs (you could also store this in database)
    const slugToCompanyMap: Record<string, number> = {
      'quick-fix-hvac': 4,
      'city-climate-control': 5, 
      'metro-hvac-services': 6
    };

    const companyId = slugToCompanyMap[slug];
    if (!companyId) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Attach tenant info to request
    (req as any).tenant = {
      slug,
      companyId
    };

    next();
  } catch (error) {
    console.error("Error in tenant middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to verify user belongs to tenant
export const verifyTenantAccess: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;

    if (!user || !tenant) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userCompanyId = await storage.getUserCompanyId(user.id);
    
    if (userCompanyId !== tenant.companyId) {
      return res.status(403).json({ message: "Access denied to this tenant" });
    }

    next();
  } catch (error) {
    console.error("Error verifying tenant access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};