import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { HostRequestHandlers } from "../../utils/hostRequests";

export type HostHandlers = Partial<HostRequestHandlers>;

const EMPTY_HOST_HANDLERS: HostHandlers = {};

const HostHandlersContext = createContext<HostHandlers>(EMPTY_HOST_HANDLERS);

type HostHandlersProviderProps = {
  value: HostHandlers | null;
  children: ReactNode;
};

export const HostHandlersProvider = ({
  value,
  children
}: HostHandlersProviderProps): JSX.Element => {
  return (
    <HostHandlersContext.Provider value={value ?? EMPTY_HOST_HANDLERS}>
      {children}
    </HostHandlersContext.Provider>
  );
};

export const useHostHandlers = (): HostHandlers => {
  return useContext(HostHandlersContext);
};
