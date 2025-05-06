"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Menu,
  X,
  BarChart,
  Shield,
  FileText,
  Users,
  Settings,
  LogOut,
  Layers,
  User,
  FileCheck, // Added for KYC
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useIsAuthenticated } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
}

const NavItem = ({ href, label, isActive }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-1/2 bg-gradient-to-r from-primary/70 to-primary"
          layoutId="navbar-indicator"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
    </Link>
  );
};

interface NavbarProps {
  showAuthButtons?: boolean;
}

export default function Navbar({ showAuthButtons = true }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const isUserAdmin = user?.isAdmin || false;

  useEffect(() => {
    console.log("Auth status:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const showLoginButtons = showAuthButtons && !isAuthenticated;
  const showUserMenu = isAuthenticated;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b shadow-sm py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-500 rounded-md rotate-45 transform-gpu" />
              <div className="absolute inset-[3px] bg-background dark:bg-background rounded-sm" />
              <Layers
                size={20}
                className="absolute inset-0 m-auto text-primary"
              />
            </div>
            <span className="font-bold text-xl">BlockVerify</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <NavItem href="/" label="Home" isActive={pathname === "/"} />
            <NavItem
              href="/about"
              label="About"
              isActive={pathname === "/about"}
            />
            <NavItem
              href="/features"
              label="Features"
              isActive={pathname === "/features"}
            />
            <NavItem
              href="/documents"
              label="Documents"
              isActive={pathname === "/documents"}
            />
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {showLoginButtons && (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {showUserMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  {user?.name || "My Account"} <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {isUserAdmin ? "Administrator" : "Connected to Blockchain"}
                  </p>
                </div>
                <DropdownMenuSeparator />

                {/* Admin-only menu items */}
                {isUserAdmin && (
                  <>
                    <Link href="/dashboard">
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <BarChart size={16} />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/documents">
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <FileText size={16} />
                        Documents
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/security">
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Shield size={16} />
                        Security
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/settings">
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Settings size={16} />
                        Settings
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Menu items for all users */}
                <Link href="/profile/me">
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <User size={16} />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/kyc">
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <FileCheck size={16} />
                    KYC Verification
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-500 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-md"
          >
            <div className="container mx-auto py-4 flex flex-col gap-3">
              <Link
                href="/"
                className={`px-4 py-2 rounded-md ${
                  pathname === "/" ? "bg-muted text-primary" : "text-foreground"
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`px-4 py-2 rounded-md ${
                  pathname === "/about"
                    ? "bg-muted text-primary"
                    : "text-foreground"
                }`}
              >
                About
              </Link>
              <Link
                href="/features"
                className={`px-4 py-2 rounded-md ${
                  pathname === "/features"
                    ? "bg-muted text-primary"
                    : "text-foreground"
                }`}
              >
                Features
              </Link>
              <Link
                href="/documents"
                className={`px-4 py-2 rounded-md ${
                  pathname === "/documents"
                    ? "bg-muted text-primary"
                    : "text-foreground"
                }`}
              >
                Documentation
              </Link>

              {showLoginButtons && (
                <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {showUserMenu && (
                <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {isUserAdmin
                        ? "Administrator"
                        : "Connected to Blockchain"}
                    </p>
                  </div>

                  {/* Admin-only mobile menu items */}
                  {isUserAdmin && (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md"
                      >
                        <BarChart size={16} />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/documents"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md"
                      >
                        <FileText size={16} />
                        Documents
                      </Link>
                      <Link
                        href="/dashboard/security"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md"
                      >
                        <Shield size={16} />
                        Security
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                    </>
                  )}

                  {/* Menu items for all users */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md"
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <Link
                    href="/kyc"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-md"
                  >
                    <FileCheck size={16} />
                    KYC Verification
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
