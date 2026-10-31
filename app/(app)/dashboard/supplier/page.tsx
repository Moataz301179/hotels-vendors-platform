import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupplierDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Supplier Workspace</h1>
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Submit New Quote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-green-600">Ready for shipment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</P>
          </CardContent>
          <CardContent>
            <div className="text-2xl font-bold">$12,400</div>
            <p className="text-xs text-muted-foreground">Across 3 invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Hotel Cairo Nile - Housekeeping</p>
                    <p className="text-xs text-muted-foreground">Deadline: Nov 5, 2026</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Bid Submitted</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Update Pricing</p>
              <p className="text-xs text-muted-foreground">Refresh your product list</p>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Shipping Log</p>
              <p className="text-xs text-muted-foreground">Track active deliveries</p>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Invoice Portal</p>
              <p className="text-xs text-muted-foreground">Manage billing & payments</p>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">ETA Signing</p>
              <p className="text-xs text-muted-foreground">Verify e-seal connectivity</p>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
