import type {PropsWithChildren} from "react";
import {createContext, useContext, useState} from "react";

// Create a context
const ToggleContext = createContext({
    isToggled: true,
  setIsToggled: (state: boolean) => {},
});

// Provider Component
export const ToggleContextProvider = ({ children }: PropsWithChildren) => {
    const [isToggled, setIsToggled] = useState(true);

  return (
    <ToggleContext.Provider value={{ isToggled, setIsToggled }}>
      {children}
    </ToggleContext.Provider>
  );
};

// Hook to use the toggle context
export const getToggleState = () => useContext(ToggleContext);
