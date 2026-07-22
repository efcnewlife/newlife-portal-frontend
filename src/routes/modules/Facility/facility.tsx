import BookingManagement from "@/pages/Facility/Booking/BookingManagement";
import OverrideLogManagement from "@/pages/Facility/OverrideLog/OverrideLogManagement";
import RentalRateManagement from "@/pages/Facility/RentalRate/RentalRateManagement";
import RoomManagement from "@/pages/Facility/Room/RoomManagement";
import RoomSlotTemplateManagement from "@/pages/Facility/RoomSlotTemplate/RoomSlotTemplateManagement";
import RoomBlackoutManagement from "@/pages/Facility/RoomBlackout/RoomBlackoutManagement";
import { AppRoute } from "@/types/route";

export const facilityRoutes: AppRoute[] = [
  {
    path: "/facility/rooms",
    element: <RoomManagement />,
    meta: {
      title: "Room Management",
      description: "Facility room management",
      requiresAuth: true,
      breadcrumb: ["Facility", "Rooms"],
    },
  },
  {
    path: "/facility/room-slot-templates",
    element: <RoomSlotTemplateManagement />,
    meta: {
      title: "Room Slot Templates",
      description: "Facility room slot template management",
      requiresAuth: true,
      breadcrumb: ["Facility", "Room Slot Templates"],
    },
  },
  {
    path: "/facility/room-blackouts",
    element: <RoomBlackoutManagement />,
    meta: {
      title: "Room Blackouts",
      description: "Facility room blackout management",
      requiresAuth: true,
      breadcrumb: ["Facility", "Room Blackouts"],
    },
  },
  {
    path: "/facility/rental-rates",
    element: <RentalRateManagement />,
    meta: {
      title: "Rental Rates",
      description: "Facility rental rate management",
      requiresAuth: true,
      breadcrumb: ["Facility", "Rental Rates"],
    },
  },
  {
    path: "/facility/bookings",
    element: <BookingManagement />,
    meta: {
      title: "Booking Management",
      description: "Facility booking management",
      requiresAuth: true,
      breadcrumb: ["Facility", "Bookings"],
    },
  },
  {
    path: "/facility/override-logs",
    element: <OverrideLogManagement />,
    meta: {
      title: "Override Logs",
      description: "Facility booking override log management",
      requiresAuth: true,
      breadcrumb: ["Facility", "Override Logs"],
    },
  },
];
