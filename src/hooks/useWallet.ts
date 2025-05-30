"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    provider: null,
    signer: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to continue."
        );
      }

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      setWallet({
        isConnected: true,
        address,
        balance: ethers.formatEther(balance),
        provider,
        signer,
      });

      // Store connection in localStorage
      localStorage.setItem("walletConnected", "true");
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      balance: null,
      provider: null,
      signer: null,
    });
    localStorage.removeItem("walletConnected");
  };

  const refreshBalance = async () => {
    if (wallet.provider && wallet.address) {
      try {
        const balance = await wallet.provider.getBalance(wallet.address);
        setWallet((prev) => ({
          ...prev,
          balance: ethers.formatEther(balance),
        }));
      } catch (err) {
        console.error("Error refreshing balance:", err);
      }
    }
  };

  const sendTransaction = async (to: string, value: string) => {
    if (!wallet.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = await wallet.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
      });

      await tx.wait();
      await refreshBalance();

      return tx;
    } catch (err) {
      console.error("Transaction failed:", err);
      throw err;
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem("walletConnected");
      if (wasConnected === "true" && typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error("Auto-connect failed:", err);
        }
      }
    };

    autoConnect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (wallet.isConnected) {
          // Reconnect with new account
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload on chain change
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [wallet.isConnected]);

  return {
    wallet,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    isLoading,
    error,
  };
};
