import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

interface SettingsContextType {
  settings: Record<string, string>;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Record<string, string>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: "Martabak Aldi",
    store_address: "Jl. Raya Martabak No. 88",
    store_phone: "0812-3456-7890",
    opening_time: "16:00",
    closing_time: "23:00",
    receipt_header: "MARTABAK ALDI",
    receipt_footer: "Terima Kasih!",
    auto_deduct_inventory: "true",
    default_cash_drawer: "200000",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && data.map) {
        setSettings((prev) => ({ ...prev, ...data.map }));
      }
    } catch (err) {
      console.warn("Could not load remote settings, using defaults:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Record<string, string>) => {
    await api.updateSettings(newSettings);
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
