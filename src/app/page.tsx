"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Shield,
  Database,
  FileCheck,
  Globe,
  Lock,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 to-slate-900 text-white">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-[100px] opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-full filter blur-[120px] opacity-10"></div>
          <div className="absolute h-full w-full bg-[url('/grid-pattern.svg')] bg-repeat opacity-10"></div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative flex items-center justify-center w-16 h-16 bg-blue-600 bg-opacity-20 rounded-2xl border border-blue-500/30 shadow-glow">
                <Shield className="w-8 h-8 text-blue-400" />
                <div className="absolute inset-0 border border-blue-500/50 rounded-2xl animate-pulse"></div>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              Secure Identity Verification on the Blockchain
            </motion.h1>

            <motion.p
              className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Our decentralized identity platform enables secure document
              verification and storage, protecting your data with advanced
              blockchain technology.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                size="lg"
                asChild
                className="text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0"
              >
                <Link href="/register">
                  Get Started <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg border-slate-500 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900"
              >
                <Link href="/about">Learn More</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 to-transparent z-10 h-1/3 bottom-0"></div>
              <Image
                src="https://videos.openai.com/vg-assets/assets%2Ftask_01jtnjsaf6enhbwc5pe52tb6fb%2F1746628628_img_0.webp?st=2025-05-07T12%3A52%3A15Z&se=2025-05-13T13%3A52%3A15Z&sks=b&skt=2025-05-07T12%3A52%3A15Z&ske=2025-05-13T13%3A52%3A15Z&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skoid=3d249c53-07fa-4ba4-9b65-0bf8eb4ea46a&skv=2019-02-02&sv=2018-11-09&sr=b&sp=r&spr=https%2Chttp&sig=z7P21KXrEJwpQYCo8efOjM6xOMYL31nhBtufDtJJxC4%3D&az=oaivgprodscus"
                alt="Platform Dashboard"
                width={1200}
                height={675}
                className="w-full h-auto rounded-t-xl border border-slate-700/50 shadow-2xl"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
              Powered by Blockchain Technology
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our platform combines cutting-edge blockchain technology with
              user-friendly interfaces to provide secure identity verification.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: <Shield className="h-10 w-10 text-blue-400" />,
                title: "Secure Identity",
                description:
                  "Your identity is secured using cryptographic proofs and stored on an immutable blockchain.",
              },
              {
                icon: <Lock className="h-10 w-10 text-green-400" />,
                title: "Privacy Focused",
                description:
                  "Only verification results are stored on-chain, keeping your personal data private and secure.",
              },
              {
                icon: <FileCheck className="h-10 w-10 text-purple-400" />,
                title: "Document Verification",
                description:
                  "Upload and verify important documents with confidence in their authenticity.",
              },
              {
                icon: <Database className="h-10 w-10 text-amber-400" />,
                title: "Decentralized Storage",
                description:
                  "Documents are stored using IPFS, ensuring they can never be tampered with or lost.",
              },
              {
                icon: <Globe className="h-10 w-10 text-indigo-400" />,
                title: "Global Accessibility",
                description:
                  "Access your verified identity and documents from anywhere in the world.",
              },
              {
                icon: <Users className="h-10 w-10 text-rose-400" />,
                title: "Third-Party Integration",
                description:
                  "Allow trusted third parties to verify your identity without sharing sensitive data.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-blue-700/50 hover:shadow-blue-900/20 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 flex flex-col items-start">
                    <div className="p-3 rounded-lg bg-slate-800/50 mb-5">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
              How It Works
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our verification process is simple, secure, and efficient.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Create Your Account",
                description:
                  "Sign up and complete your profile to get started with secure identity verification.",
              },
              {
                step: "02",
                title: "Upload Documents",
                description:
                  "Upload your identification documents through our secure interface.",
              },
              {
                step: "03",
                title: "Verification Process",
                description:
                  "Our system verifies your documents and creates a secure blockchain attestation.",
              },
              {
                step: "04",
                title: "Access Your Digital Identity",
                description:
                  "Once verified, access and share your digital identity credentials securely.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-start gap-6 mb-12 relative",
                  index < 3 &&
                    "after:absolute after:left-7 after:top-20 after:w-0.5 after:h-16 after:bg-gradient-to-b after:from-blue-500 after:to-transparent"
                )}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {item.title}
                  </h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] bg-repeat opacity-5"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-[100px] opacity-10"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Ready to Secure Your Identity?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Join thousands of users who trust our platform for secure identity
              verification and document storage.
            </p>
            <Button
              size="lg"
              asChild
              className="text-lg bg-white text-blue-900 hover:bg-blue-50 shadow-lg shadow-blue-900/20"
            >
              <Link href="/register">
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold text-white">
                  BlockVerify
                </span>
              </div>
              <p className="text-sm">
                Secure identity verification powered by blockchain technology.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="hover:text-white transition-colors"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/enterprise"
                    className="hover:text-white transition-colors"
                  >
                    Enterprise
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="hover:text-white transition-colors"
                  >
                    API
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-white transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal"
                    className="hover:text-white transition-colors"
                  >
                    Legal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500">
              © 2023 BlockVerify. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-slate-500 hover:text-white transition-colors"
              >
                Cookies Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
