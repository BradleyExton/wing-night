import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type HostOverridesUi = {
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
};

const DEFAULT_HOST_OVERRIDES_UI: HostOverridesUi = {
  showOverridesButton: false,
  overridesShowBadge: false,
  onOpenOverrides: (): void => undefined
};

const HostOverridesUiContext = createContext<HostOverridesUi>(DEFAULT_HOST_OVERRIDES_UI);

type HostOverridesUiProviderProps = {
  value: HostOverridesUi;
  children: ReactNode;
};

export const HostOverridesUiProvider = ({
  value,
  children
}: HostOverridesUiProviderProps): JSX.Element => {
  return (
    <HostOverridesUiContext.Provider value={value}>
      {children}
    </HostOverridesUiContext.Provider>
  );
};

export const useHostOverridesUi = (): HostOverridesUi => {
  return useContext(HostOverridesUiContext);
};
