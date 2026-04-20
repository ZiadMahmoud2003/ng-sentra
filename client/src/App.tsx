import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SOCLayout from "./components/SOCLayout";
import Home from "./pages/Home";
import ComponentsGrid from "./pages/ComponentsGrid";
import ComponentViewer from "./pages/ComponentViewer";
import SOARPanel from "./pages/SOARPanel";
import AIModelsPanel from "./pages/AIModelsPanel";
import AdminComponents from "./pages/AdminComponents";
import AdminUsers from "./pages/AdminUsers";
import AdminAudit from "./pages/AdminAudit";
import LoginPage from "./pages/LoginPage";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <SOCLayout><Home /></SOCLayout>} />
      <Route path="/components" component={() => <SOCLayout><ComponentsGrid /></SOCLayout>} />
      <Route path="/components/:slug" component={() => <SOCLayout><ComponentViewer /></SOCLayout>} />
      <Route path="/soar" component={() => <SOCLayout><SOARPanel /></SOCLayout>} />
      <Route path="/ai-models" component={() => <SOCLayout><AIModelsPanel /></SOCLayout>} />
      <Route path="/admin/components" component={() => <SOCLayout><AdminComponents /></SOCLayout>} />
      <Route path="/admin/users" component={() => <SOCLayout><AdminUsers /></SOCLayout>} />
      <Route path="/admin/audit" component={() => <SOCLayout><AdminAudit /></SOCLayout>} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
