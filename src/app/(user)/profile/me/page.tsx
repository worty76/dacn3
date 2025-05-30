"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
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
import { Edit, CheckCircle, Clock, AlertCircle, Wallet } from "lucide-react";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define TypeScript interfaces for our data structures
interface Activity {
  id: number;
  type: string;
  status: "completed" | "pending";
  date: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  did?: string;
  walletAddress?: string;
  isVerified: boolean;
  recentActivity: Activity[];
}

// Fallback mock data in case API fails
const mockUser: UserProfile = {
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore(); // Get token from auth store
  const { wallet } = useWallet();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get token from auth store instead of localStorage
        if (!token) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        // Fetch user profile data
        const response = await fetch("http://localhost:8000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const userData = await response.json();

        if (!userData.success) {
          throw new Error(userData.message || "Failed to load profile data");
        }

        // Fetch blockchain identity if available
        let blockchainData = null;
        try {
          const blockchainResponse = await fetch(
            "http://localhost:8000/api/blockchain/identity",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (blockchainResponse.ok) {
            blockchainData = await blockchainResponse.json();
          }
        } catch (blockchainError) {
          console.error("Error fetching blockchain identity:", blockchainError);
          // We continue even if blockchain data fetch fails
        }

        // Transform API data to match our UI requirements
        const transformedUser: UserProfile = {
          name: userData.user.name,
          email: userData.user.email,
          phone: userData.user.phone,
          avatar: userData.user.avatar || "https://github.com/shadcn.png", // Default avatar
          did: blockchainData?.identity?.identityHash || userData.user.did,
          walletAddress:
            blockchainData?.identity?.blockchainAddress ||
            userData.user.walletAddress,
          isVerified: blockchainData?.identity?.verified || false,
          recentActivity: [], // Will be populated from logs API in a real app
        };

        setUser(transformedUser);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setUser(mockUser); // Fallback to mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]); // Add token as dependency to re-fetch when token changes

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    try {
      setError(null);

      // Get token from auth store instead of localStorage
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("http://localhost:8000/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      // Update local state with new user data
      setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load profile data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <WalletConnectButton />
      </div>

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
                <p className="text-gray-500">
                  {user.phone || "No phone number"}
                </p>
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
              {user.did ? (
                <p className="text-sm bg-gray-100 p-3 rounded-md font-mono break-all">
                  {user.did}
                </p>
              ) : (
                <p className="text-sm bg-gray-100 p-3 rounded-md">
                  No DID associated with this account yet.
                </p>
              )}
              <p className="text-xs text-gray-500">
                This is your unique identifier on the blockchain that verifies
                your digital identity.
              </p>
            </div>

            {user.walletAddress && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">Wallet Address</h3>
                <p className="text-sm bg-gray-100 p-3 rounded-md font-mono break-all">
                  {user.walletAddress}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet & Activity Card */}
        <div className="space-y-6">
          {/* Wallet Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Connection
              </CardTitle>
              <CardDescription>
                Connect your wallet for premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Connected
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-mono text-xs break-all">
                      {wallet.address}
                    </p>
                    <p className="text-gray-500">
                      Balance: {parseFloat(wallet.balance!).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      Not Connected
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Connect your wallet to enable premium features like
                    multi-signature verification.
                  </p>
                  <WalletConnectButton />
                </div>
              )}
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
              {user.recentActivity && user.recentActivity.length > 0 ? (
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
              ) : (
                <p className="text-sm text-gray-500">
                  No recent activity found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
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
