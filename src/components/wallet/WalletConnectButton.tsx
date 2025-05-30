"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export default function WalletConnectButton() {
  const { wallet, connectWallet, disconnectWallet, isLoading, error } =
    useWallet();

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied to clipboard");
    }
  };

  const openInExplorer = () => {
    if (wallet.address) {
      window.open(
        `https://sepolia.etherscan.io/address/${wallet.address}`,
        "_blank"
      );
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!wallet.isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span>{formatAddress(wallet.address!)}</span>
          <Badge variant="secondary" className="ml-1">
            {parseFloat(wallet.balance!).toFixed(4)} ETH
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Wallet Connected</p>
          <p className="text-xs text-gray-500 font-mono">{wallet.address}</p>
          <p className="text-xs text-gray-500 mt-1">
            Balance: {parseFloat(wallet.balance!).toFixed(6)} ETH
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openInExplorer}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnectWallet} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
