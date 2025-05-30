"use client";

import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Welcome to Admin Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            You can manage users and documents from here.
          </p>
          <Button className="mt-4">Get Started</Button>
        </div>
      </div>
    </>
  );
}
