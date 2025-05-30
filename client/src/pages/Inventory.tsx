import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, AlertTriangle, TrendingDown, Boxes } from "lucide-react";
import type { Inventory } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: inventory = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: lowStockItems = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice || "0");
      return sum + (unitPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getStockStatus = (item: Inventory) => {
    if (item.quantity <= 0) return { status: "out-of-stock", color: "bg-red-100 text-red-800" };
    if (item.quantity <= item.minQuantity) return { status: "low-stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "in-stock", color: "bg-green-100 text-green-800" };
  };

  if (isLoading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-xl font-bold text-blue-600">
                  {getTotalItems().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Total Value</p>
                <p className="text-xl font-bold text-green-600">
                  ${getTotalValue().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-slate-600">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600">
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-slate-600">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">
                  {inventory.filter(item => item.quantity <= 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-3">
              The following items are running low and need to be restocked:
            </p>
            <div className="grid gap-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-red-600">
                    {item.quantity} left (min: {item.minQuantity})
                  </span>
                </div>
              ))}
            </div>
            {lowStockItems.length > 5 && (
              <p className="text-sm text-yellow-600 mt-2">
                +{lowStockItems.length - 5} more items need restocking
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardContent className="p-6">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? "No items found matching your search." : "No inventory items added yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-slate-800">{item.name}</h3>
                          <Badge className={stockStatus.color}>
                            {stockStatus.status.replace("-", " ")}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-slate-600 mb-2">{item.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-500">
                          <div>
                            <span className="font-medium">SKU:</span> {item.sku}
                          </div>
                          
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity}
                          </div>
                          
                          <div>
                            <span className="font-medium">Min Quantity:</span> {item.minQuantity}
                          </div>
                          
                          {item.unitPrice && (
                            <div>
                              <span className="font-medium">Unit Price:</span> ${parseFloat(item.unitPrice).toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        {item.supplier && (
                          <div className="mt-2 text-sm text-slate-500">
                            <span className="font-medium">Supplier:</span> {item.supplier}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Restock
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
