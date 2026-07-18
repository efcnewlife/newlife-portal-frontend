import { MdCorporateFare } from "react-icons/md";
import { ModuleRoute } from "@/types/route";
import { orgRoutes } from "./org";

export const orgMenuRoutes: ModuleRoute = {
  module: "org",
  meta: {
    title: "Organization",
    description: "Positions and ministry management",
    icon: <MdCorporateFare />,
    order: 5,
  },
  routes: orgRoutes,
};
