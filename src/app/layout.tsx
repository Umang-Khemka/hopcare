import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { ReportsProvider } from "@/src/contexts/ReportsContext"; // ✅ ADD THIS IMPORT
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Team Achievers - Healthcare App",
  description: "Your healthcare management solution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ReportsProvider> {/* ✅ ADD THIS WRAPPER */}
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
          </ReportsProvider> {/* ✅ CLOSE THE WRAPPER */}
        </AuthProvider>
      </body>
    </html>
  );
}