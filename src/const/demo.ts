export interface DemoNavItem {
  name: string;
  icon: string; // icon resolver key, e.g. "MdScience"
  path: string;
  order?: number;
}

export const DEMO_NAV: DemoNavItem[] = [
  {
    name: "Demo Data Page",
    icon: "MdScience",
    path: "/demo/data-page",
    order: 99,
  },
];
