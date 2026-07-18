import { MdGroups } from "react-icons/md";
import { ModuleRoute } from "@/types/route";
import { ministryRoutes } from "./ministry";

export const ministryMenuRoutes: ModuleRoute = {
  module: "ministry",
  meta: {
    title: "Ministry",
    description: "Ministry and member management",
    icon: <MdGroups />,
    order: 4,
  },
  routes: ministryRoutes,
};
