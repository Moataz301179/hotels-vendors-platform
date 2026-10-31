import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
        <div className="flex gap-2">
          <button className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors">
            System Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hotels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Verified partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312</div>
            <p className="text-xs text-muted-foreground">System-wide</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.2M</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Platform Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">Identity Verified: Hotel Cairo Nile</p>
                      <p className="text-xs text-muted-foreground">Admin Action: identity-binding-confirmed</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">2 mins ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-3 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Tenant Management</p>
              <p className="text-xs text-muted-foreground">Onboard/offboard organizations</p>
            </button>
            <button className="w-full p-3 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Role Provisioning</p>
              <p className="text-xs text-muted-foreground">Assign administrative rights</p>
            </button>
            <button className="w-full p-3 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Global Policy</p>
              <p className="text-xs text-muted-foreground">Manage procurement rules</p>
            </button>
            <button className="w-full p-3 text-left border rounded-lg hover:bg-slate-50 transition-colors">
              <p className="font-semibold">Security Audit</p>
              <p className="text-xs text-muted-foreground">View system-wide tamper logs</p>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
