// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/auth/protected-route";
import { useAuth } from "@/hooks/use-auth";
import OnboardingTour from "@/components/onboarding/tour";
import { HelpCircle } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      // Show tour after a brief delay
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("hasSeenTour", "true");
  };

  const handleShowTour = () => {
    setShowTour(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50 dark:bg-zinc-900"
    >
      {/* Onboarding Tour */}
      {showTour && <OnboardingTour onComplete={handleTourComplete} />}

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-zinc-800 shadow"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Certificate Generator</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowTour}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Show Guide
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.name}
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your certificates
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0, duration: 0.4, type: "spring" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 cursor-pointer"
            data-tour="create-new"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Create New Certificate
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Start creating a new certificate from scratch
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push("/generator")}
                className="w-full"
              >
                Create Now
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 cursor-pointer"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Email Queue</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Manage and send certificate emails
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push("/email-queue")}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Open Queue
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 cursor-pointer"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Templates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Browse and manage certificate templates
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push("/templates")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Templates
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6 cursor-pointer"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Recent Certificates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              View your recently created certificates
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="w-full">
                Coming Soon
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Click &quot;Create New Certificate&quot; to start designing</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Upload your certificate template or use a default one</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Add text fields, signatures (images), and customize fonts
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Drag and position elements on the certificate</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Add certificates to Email Queue to send later (works offline!)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Download your finished certificate as PNG</span>
            </li>
          </ul>
        </motion.div>
      </main>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
