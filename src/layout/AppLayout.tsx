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
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${isExpanded ? "xl:ml-[290px]" : "xl:ml-[90px]"} ${
          isMobileOpen ? "ml-0" : ""
        }`}
      >
        <AppHeader />
        <div className="mx-auto min-w-0 max-w-full overflow-x-hidden p-4 md:p-6">
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
