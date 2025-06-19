import React, { createContext, useState } from 'react';

// Default to light; you can wire this up to a toggle or system preference
export const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
