import { createContext, useContext, useState } from "react";

interface PageHeaderContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

// Default value keeps AppHeader safe when rendered outside a provider
// (e.g. AlternativeLayout), where the breadcrumb simply stays empty.
const PageHeaderContext = createContext<PageHeaderContextType>({
  pageTitle: "",
  setPageTitle: () => {},
});

export const usePageHeader = () => useContext(PageHeaderContext);

export const PageHeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageTitle, setPageTitle] = useState<string>("");

  return <PageHeaderContext.Provider value={{ pageTitle, setPageTitle }}>{children}</PageHeaderContext.Provider>;
};
