"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

// Mock user data - replace with actual API calls in production
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://github.com/shadcn.png",
  did: "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
  isVerified: true,
  recentActivity: [
    { id: 1, type: "Verification", status: "completed", date: "2023-06-15" },
    { id: 2, type: "Profile Update", status: "completed", date: "2023-05-20" },
    { id: 3, type: "DID Creation", status: "completed", date: "2023-04-10" },
  ],
};

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Replace with actual API call to fetch user data
    // const fetchUserData = async () => {
    //   const response = await fetch('/api/user/profile');
    //   const userData = await response.json();
    //   setUser(userData);
    // };
    // fetchUserData();
  }, []);

  const handleProfileUpdate = (updatedData) => {
    // In a real app, send this to your backend API
    setUser({ ...user, ...updatedData });
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Manage your personal details and account
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="mt-1">
                  {user.isVerified ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      <Clock className="h-3 w-3 mr-1" /> Pending Verification
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h3 className="font-semibold">Decentralized Identifier (DID)</h3>
              <p className="text-sm bg-gray-100 p-3 rounded-md font-mono break-all">
                {user.did}
              </p>
              <p className="text-xs text-gray-500">
                This is your unique identifier on the blockchain that verifies
                your digital identity.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your identity verification history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                  <div>
                    {activity.status === "completed" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <EditProfileDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleProfileUpdate}
        user={user}
      />
    </div>
  );
}
