import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { RootToaster } from "@/components/RootToaster";

export const metadata = {
  title: "Electric Inventory System",
  description: "Manage electrical inventory, stock, and branches",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* CLIENT TOASTER HERE */}
        <RootToaster />
      </body>
    </html>
  );
}
