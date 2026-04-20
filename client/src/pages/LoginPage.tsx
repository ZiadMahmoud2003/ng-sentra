import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [isAuthenticated, loading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-12 h-12 text-primary" />
          <div className="text-left">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">NG-SENTRA</h1>
            <p className="text-xs text-muted-foreground font-mono tracking-widest">SECURITY OPERATIONS CENTER</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Authenticate to access the SOC dashboard.</p>
        <Button className="w-full" size="lg" onClick={() => window.location.href = getLoginUrl()}>
          <Shield className="w-4 h-4 mr-2" />
          Sign In to NG-SENTRA
        </Button>
      </div>
    </div>
  );
}
