import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';

type SearchContextType = {
  queryString: string;
  setQueryString: Dispatch<SetStateAction<string>>;
}

const SearchContext = createContext<SearchContextType | null>(null);

export const SearchContextProvider = ({ children }: PropsWithChildren) => {
  const [queryString, setQueryString] = useState("");

  const contextValue = useMemo(() => ({
    queryString,
    setQueryString,
  }), [queryString, setQueryString])

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearchContext = () => {
  // get the context
  const context = useContext(SearchContext);

  // if `undefined`, throw an error
  if (!context) {
    throw new Error("useSearchContext was used outside of its Provider");
  }

  return context;
};