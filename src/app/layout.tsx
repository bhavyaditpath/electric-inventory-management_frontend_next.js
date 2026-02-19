import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { RootToaster } from "@/components/RootToaster";
import { CallProvider } from "@/contexts/CallContext";
import ChatReactionNotifier from "@/components/chat/ChatReactionNotifier";

export const metadata = {
  title: "Electric Inventory System",
  description: "Manage electrical inventory, stock, and branches",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CallProvider>
            <ChatReactionNotifier />
            {children}
          </CallProvider>
        </AuthProvider>

        {/* CLIENT TOASTER HERE */}
        <RootToaster />
      </body>
    </html>
  );
}
