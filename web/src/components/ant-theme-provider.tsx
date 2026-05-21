"use client";

import type { ReactNode } from "react";
import { ProConfigProvider } from "@ant-design/pro-components";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

import { getAntThemeConfig } from "@/lib/app-theme";
import { useThemeStore } from "@/stores/use-theme-store";

export function AntThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const dark = theme === "dark";

  return (
    <ConfigProvider
      locale={zhCN}
      theme={getAntThemeConfig(dark)}
    >
      <ProConfigProvider dark={dark}>
        <App>{children}</App>
      </ProConfigProvider>
    </ConfigProvider>
  );
}
