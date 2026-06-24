'use client';

import { createContext, useContext } from 'react';

type HomeScreenMenuApi = {
  openMainMenu: (x: number, y: number) => void;
};

export const HomeScreenMenuContext = createContext<HomeScreenMenuApi | null>(null);

export type { HomeScreenMenuApi };

export function useHomeScreenMenu() {
  return useContext(HomeScreenMenuContext);
}
