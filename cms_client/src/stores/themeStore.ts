import {create} from "zustand";
import {persist} from "zustand/middleware";

export type ThemeName =
  | "星灰"
  | "芽绿"
  | "麦秆黄"
  | "苹果红"
  | "湖水蓝"
  | "黄昏灰";

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "星灰",
      setTheme: (theme) => set({theme}),
    }),
    {
      name: "theme-v2",
    },
  ),
);
