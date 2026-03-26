import type {ThemeConfig} from "antd";
import {theme as antdTheme} from "antd";

import type {ThemeName} from "../stores/themeStore";

export interface AppThemeConfig {
  antdConfig: ThemeConfig;
  /** Header 渐变背景 */
  headerGradient: string;
  /** Header 下边框颜色 */
  headerBorder: string;
  /** Header 阴影 */
  headerShadow: string;
  /** 是否为深色模式 */
  isDark: boolean;
  /** 选择器中展示的色块颜色（主色 500） */
  swatch: string;
}

/** 公共 Message 组件 token */
const messageComponents: ThemeConfig["components"] = {
  Message: {
    contentPadding: "12px 16px",
    fontSize: 14,
    borderRadius: 8,
  },
};

export const THEMES: Record<ThemeName, AppThemeConfig> = {
  星灰: {
    antdConfig: {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#7f878a",
        colorBgLayout: "#f1fafe",
        fontSize: 14,
        borderRadius: 6,
      },
      components: messageComponents,
    },
    headerGradient: "linear-gradient(135deg, #7f878a 0%, #4f5759 100%)",
    headerBorder: "1px solid #4f5759",
    headerShadow: "0 2px 8px rgba(79, 87, 89, 0.25)",
    isDark: false,
    swatch: "#b2bbbe",
  },

  芽绿: {
    antdConfig: {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#668f06",
        colorBgLayout: "#f0f7e8",
        fontSize: 14,
        borderRadius: 6,
      },
      components: messageComponents,
    },
    headerGradient: "linear-gradient(135deg, #668f06 0%, #395e00 100%)",
    headerBorder: "1px solid #395e00",
    headerShadow: "0 2px 8px rgba(57, 94, 0, 0.3)",
    isDark: false,
    swatch: "#96c24e",
  },

  麦秆黄: {
    antdConfig: {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#b9a028",
        colorBgLayout: "#fdf8e8",
        fontSize: 14,
        borderRadius: 6,
      },
      components: messageComponents,
    },
    headerGradient: "linear-gradient(135deg, #b9a028 0%, #7d6500 100%)",
    headerBorder: "1px solid #7d6500",
    headerShadow: "0 2px 8px rgba(125, 101, 0, 0.3)",
    isDark: false,
    swatch: "#f8df70",
  },

  苹果红: {
    antdConfig: {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#f15642",
        colorBgLayout: "#fdf0ee",
        fontSize: 14,
        borderRadius: 6,
      },
      components: messageComponents,
    },
    headerGradient: "linear-gradient(135deg, #f15642 0%, #8e0000 100%)",
    headerBorder: "1px solid #8e0000",
    headerShadow: "0 2px 8px rgba(241, 86, 66, 0.3)",
    isDark: false,
    swatch: "#f15642",
  },

  湖水蓝: {
    antdConfig: {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#789ba5",
        colorBgLayout: "#f0f8fa",
        fontSize: 14,
        borderRadius: 6,
      },
      components: messageComponents,
    },
    headerGradient: "linear-gradient(135deg, #789ba5 0%, #43656e 100%)",
    headerBorder: "1px solid #43656e",
    headerShadow: "0 2px 8px rgba(67, 101, 110, 0.3)",
    isDark: false,
    swatch: "#b0d5df",
  },

  黄昏灰: {
    antdConfig: {
      algorithm: antdTheme.darkAlgorithm,
      token: {
        colorPrimary: "#a3a7a9",
        fontSize: 14,
        borderRadius: 6,
      },
      components: messageComponents,
    },
    headerGradient: "linear-gradient(135deg, #323536 0%, #1e2122 100%)",
    headerBorder: "1px solid #474b4c",
    headerShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
    isDark: true,
    swatch: "#474b4c",
  },
};

export const ALL_THEME_NAMES: ThemeName[] = [
  "星灰",
  "芽绿",
  "麦秆黄",
  "苹果红",
  "湖水蓝",
  "黄昏灰",
];
