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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,200,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,200,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Animated Brand */}
        <div className="text-center mb-8 space-y-4">
          {/* Logo image */}
          <div className="flex justify-center">
            <img
              src="/manus-storage/ng-sentra-logo_fce0144c.png"
              alt="NG-SENTRA Logo"
              className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(0,200,255,0.3)]"
            />
          </div>

          {/* Animated brand name — brain bounces on the N */}
          <div className="flex items-end justify-center gap-0 select-none">
            {/* The "N" with animated brain sitting on top */}
            <div className="relative inline-flex flex-col items-center">
              {/* Brain emoji — jumps and wiggles on the N */}
              <span
                className="text-xl leading-none mb-[-2px]"
                style={{ animation: "brainBounce 1.6s ease-in-out infinite" }}
              >
                🧠
              </span>
              {/* The N */}
              <span className="text-4xl font-black tracking-tight text-foreground leading-none">N</span>
            </div>

            {/* Rest of NG-SENTRA */}
            <span className="text-4xl font-black tracking-tight text-foreground leading-none">G</span>
            <span className="text-4xl font-black tracking-tight text-foreground leading-none mx-2"> </span>
            <span className="text-4xl font-black tracking-tight"
              style={{ color: "hsl(var(--primary))" }}>S</span>
            <span className="text-4xl font-black tracking-tight text-foreground leading-none">E</span>
            <span className="text-4xl font-black tracking-tight text-foreground leading-none">N</span>
            <span className="text-4xl font-black tracking-tight text-foreground leading-none">T</span>
            <span className="text-4xl font-black tracking-tight text-foreground leading-none">R</span>
            <span className="text-4xl font-black tracking-tight"
              style={{ color: "hsl(var(--primary))" }}>A</span>
          </div>

          <p className="text-xs text-muted-foreground font-mono tracking-[0.3em] uppercase">
            Smart Security Hub
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl shadow-black/40 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Secure Access</h2>
            <p className="text-sm text-muted-foreground">
              Authenticate with your authorized credentials to access the SOC dashboard.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
              Manus OAuth
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            className="w-full h-11 font-semibold text-sm gap-2"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            <Shield className="w-4 h-4" />
            Sign In to NG-SENTRA
          </Button>

          {/* Role info */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            {[
              { role: "Admin", color: "text-red-400 border-red-500/30 bg-red-500/10", desc: "Full access" },
              { role: "Analyst", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", desc: "Ops access" },
              { role: "Viewer", color: "text-slate-400 border-slate-500/30 bg-slate-500/10", desc: "Read only" },
            ].map(r => (
              <div key={r.role} className={`text-center p-2 rounded-md border ${r.color}`}>
                <p className="text-[10px] font-bold font-mono">{r.role}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 font-mono mt-6 tracking-wider">
          NG-SENTRA © 2025 — AUTHORIZED ACCESS ONLY
        </p>
      </div>

      {/* Keyframe animation injected via style tag */}
      <style>{`
        @keyframes brainBounce {
          0%   { transform: translateY(0px) rotate(0deg); }
          15%  { transform: translateY(-10px) rotate(-8deg); }
          30%  { transform: translateY(-14px) rotate(6deg); }
          45%  { transform: translateY(-8px) rotate(-4deg); }
          55%  { transform: translateY(-12px) rotate(5deg); }
          65%  { transform: translateY(-4px) rotate(-3deg); }
          75%  { transform: translateY(-8px) rotate(4deg); }
          85%  { transform: translateY(-2px) rotate(-2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
