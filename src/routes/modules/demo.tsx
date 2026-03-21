import { MdScience } from "react-icons/md";
import DemoDataPage from "../../pages/Demo/DemoDataPage";
import { ModuleRoute } from "../../types/route";

export const demoRoutes: ModuleRoute = {
  module: "demo",
  meta: {
    title: "Demo",
    description: "Development only demo pages",
    icon: <MdScience />,
    order: 99,
  },
  routes: [
    {
      path: "/demo/data-page",
      element: <DemoDataPage />,
      meta: {
        title: "Demo",
        description: "Demo page (development only)",
        requiresAuth: true,
        breadcrumb: ["Demo"],
        devOnly: true,
      },
    },
  ],
};
