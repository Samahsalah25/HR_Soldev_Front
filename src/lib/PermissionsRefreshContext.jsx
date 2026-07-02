import { createContext, useContext } from "react";

export const PermissionsRefreshContext = createContext(() => { });

export const usePermissionsRefresh = () => useContext(PermissionsRefreshContext);
