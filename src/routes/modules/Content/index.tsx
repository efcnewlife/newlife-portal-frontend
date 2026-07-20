import { MdFolder } from "react-icons/md";
import { ModuleRoute } from "@/types/route";
import { contentRoutes } from "./content";

export const contentMenuRoutes: ModuleRoute = {
  module: "content",
  meta: {
    title: "Content",
    description: "Content management",
    icon: <MdFolder />,
    order: 4,
  },
  routes: contentRoutes,
};
