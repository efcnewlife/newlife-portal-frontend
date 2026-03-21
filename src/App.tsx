import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { NotificationContainer } from "@efcnewlife/newlife-ui";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MenuProvider, useMenuData } from "./context/MenuContext";
import { NotificationProvider } from "./context/NotificationContext";
import { routeFilterManager } from "./utils/route-filter-manager";

export default function App() {
  return (
    <AuthProvider>
      <MenuProvider>
        <NotificationProvider>
          <AppContent />
          <NotificationContainer />
        </NotificationProvider>
      </MenuProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { menus, isLoading: menuLoading } = useMenuData();
  const [router, setRouter] = useState<ReturnType<typeof routeFilterManager.createRouteConfig> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Unified routing initialization logic
  useEffect(() => {
    const initializeRouteFilter = async () => {
      try {
        // Wait for authentication and menu loading to complete
        if (authLoading || menuLoading) {
          return;
        }

        // Initialize route filtering and pass in menu data
        await routeFilterManager.initializeRoutes({
          isAuthenticated,
          user,
          permissions: [],
          roles: [],
          menus,
        });

        // Create routing configuration
        const newRouter = routeFilterManager.createRouteConfig();
        setRouter(newRouter);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize route filter:", error);
        setIsInitialized(true); // Stop loading even if it fails
      }
    };

    initializeRouteFilter();
  }, [isAuthenticated, user, authLoading, menus, menuLoading]);

  // Show loading screen until all initialization is complete
  if (!isInitialized || !router) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
