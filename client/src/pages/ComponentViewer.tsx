import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, RefreshCw, Shield, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";

export default function ComponentViewer() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, navigate] = useLocation();
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);

  const { data: components } = trpc.components.list.useQuery();
  const logAction = trpc.audit.log.useMutation();

  const component = components?.find(c => c.slug === slug);

  useEffect(() => {
    if (component) {
      logAction.mutate({
        action: "ACCESS_COMPONENT",
        target: component.name,
        details: `Accessed via iframe: ${component.url}`,
      });
    }
  }, [component?.id]);

  if (!component) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Component not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/components")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Components
          </Button>
        </div>
      </div>
    );
  }

  const iframeUrl = component.url
    ? (component.port ? `${component.url}:${component.port}` : component.url)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-3">
      {/* Header Bar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/components")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${iframeUrl && !iframeError ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
          <h2 className="font-semibold text-foreground text-sm truncate">{component.name}</h2>
          {component.category && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border hidden sm:inline">
              {component.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {iframeUrl && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setIframeKey(k => k + 1); setIframeError(false); }}
                className="text-muted-foreground hover:text-foreground h-7 px-2"
                title="Reload"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(iframeUrl, "_blank")}
                className="text-muted-foreground hover:text-foreground h-7 px-2"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono bg-muted/20 border border-border rounded-md px-3 py-2 flex-shrink-0">
        <span className="text-primary/80">URL:</span>
        <span className="flex-1 truncate">{iframeUrl ?? "Not configured"}</span>
        {component.port && <span className="text-muted-foreground/60">Port: {component.port}</span>}
      </div>

      {/* Iframe / Fallback */}
      <div className="flex-1 rounded-lg border border-border overflow-hidden bg-muted/10 relative">
        {!iframeUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-sm">
              <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Component Not Configured</h3>
                <p className="text-sm text-muted-foreground">
                  No URL has been set for <strong>{component.name}</strong>. Configure it in the Admin panel to enable iframe access.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/components")}>
                Configure Component
              </Button>
            </div>
          </div>
        ) : iframeError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-sm">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Unable to Load Interface</h3>
                <p className="text-sm text-muted-foreground">
                  The component at <code className="font-mono text-xs bg-muted px-1 rounded">{iframeUrl}</code> could not be loaded.
                  This may be due to X-Frame-Options restrictions or the service being offline.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => { setIframeKey(k => k + 1); setIframeError(false); }}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Retry
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(iframeUrl, "_blank")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open Directly
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            src={iframeUrl}
            className="w-full h-full border-0"
            title={component.name}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            onError={() => setIframeError(true)}
            onLoad={e => {
              try {
                const iframe = e.target as HTMLIFrameElement;
                if (!iframe.contentDocument) setIframeError(true);
              } catch { setIframeError(true); }
            }}
          />
        )}
      </div>
    </div>
  );
}
