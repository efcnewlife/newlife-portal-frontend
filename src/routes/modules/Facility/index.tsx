import { MdMeetingRoom } from "react-icons/md";
import { ModuleRoute } from "@/types/route";
import { facilityRoutes } from "./facility";

export const facilityMenuRoutes: ModuleRoute = {
  module: "facility",
  meta: {
    title: "Facility Booking",
    description: "Facility booking and room management",
    icon: <MdMeetingRoom />,
    order: 3,
  },
  routes: facilityRoutes,
};
