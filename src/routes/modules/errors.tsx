import { MdError } from "react-icons/md";
import NotFound from "../../pages/OtherPage/NotFound";
import { ModuleRoute } from "../../types/route";

export const errorRoutes: ModuleRoute = {
  module: "errors",
  meta: {
    title: "Error Pages",
    description: "Error and status pages",
    icon: <MdError />,
    order: 7,
  },
  routes: [
    {
      path: "*",
      element: <NotFound />,
      meta: {
        title: "404 Not Found",
        description: "Page not found",
        requiresAuth: false,
        breadcrumb: ["Error", "404"],
      },
    },
  ],
};
