import { Outlet } from "react-router";
import { ScrollToTop } from "../components/common/ScrollToTop";
import { PageHeaderProvider } from "../context/PageHeaderContext";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";

const LayoutContent: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded ? "xl:ml-[290px]" : "xl:ml-[90px]"} ${
          isMobileOpen ? "ml-0" : ""
        }`}
      >
        <AppHeader />
        <div className="p-4 mx-auto md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <PageHeaderProvider>
        <LayoutContent />
        <ScrollToTop />
      </PageHeaderProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
