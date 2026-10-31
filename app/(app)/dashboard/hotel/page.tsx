import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HotelDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Hotel Workspace</h1>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            New RFQ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-red-500">Urgent action required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Expected within 48h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Procurement Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">RFQ #{1000 + i} - Housekeeping Supplies</p>
                    <p className="text-xs text-muted-foreground">Requested: Oct 30, 2026</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
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
              <p className="font-semibold">Manage Vendors</p>
              <p className="text-xs text-muted-foreground">Review and approve suppliers</p>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Inventory Sync</p>
              <p className="text-xs text-muted-foreground">Update stock levels</p>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Finance View</p>
              <p className="text-xs text-muted-foreground">Check credit lines</p>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">ETA Compliance</p>
              <p className="text-xs text-muted-foreground">Verify e-invoicing status</p>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
