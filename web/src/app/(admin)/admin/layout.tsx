"use client";

import { FileTextOutlined, HomeOutlined, LogoutOutlined, PictureOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Flex, Layout, Menu, Typography, theme } from "antd";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { UserStatusActions } from "@/components/user-status-actions";
import { adminLayoutStyle } from "@/lib/app-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUserStore } from "@/stores/use-user-store";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { token: antToken } = theme.useToken();
  const router = useRouter();
  const pathname = usePathname();
  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);
  const isReady = useUserStore((state) => state.isReady);
  const logout = useUserStore((state) => state.clearSession);
  const colorTheme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const activeKey = pathname.startsWith("/admin/settings") ? "/admin/settings" : pathname.startsWith("/admin/assets") ? "/admin/assets" : pathname.startsWith("/admin/prompts") ? "/admin/prompts" : "";
  const pageTitle = pathname.startsWith("/admin/settings") ? "系统设置" : pathname.startsWith("/admin/assets") ? "素材库管理" : "提示词管理";
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [isReady, router, token, user?.role]);

  if (!isReady || !token || user?.role !== "admin") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: antToken.colorBgLayout }}>
        <span />
      </div>
    );
  }

  return (
    <Layout hasSider style={{ height: "100vh", overflow: "hidden", background: antToken.colorBgLayout }}>
      <Layout.Sider width={adminLayoutStyle.siderWidth} style={{ height: "100vh", overflow: "hidden", background: antToken.colorBgContainer, borderRight: `1px solid ${antToken.colorBorder}` }}>
        <Flex align="center" gap={12} style={{ height: adminLayoutStyle.brandHeight, padding: "0 20px", borderBottom: `1px solid ${antToken.colorBorderSecondary}` }}>
          <span aria-hidden style={{ display: "inline-block", width: 30, height: 30, background: antToken.colorText, WebkitMask: "url(/logo.svg) center / contain no-repeat", mask: "url(/logo.svg) center / contain no-repeat" }} />
          <Typography.Text strong style={{ fontSize: 18, letterSpacing: 0 }}>无限画布</Typography.Text>
        </Flex>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={adminLayoutStyle.menu}
          items={[
            { key: "/admin/prompts", icon: <FileTextOutlined />, label: <Link href="/admin/prompts" style={{ color: "inherit" }}>提示词管理</Link>, style: adminLayoutStyle.menuItem },
            { key: "/admin/assets", icon: <PictureOutlined />, label: <Link href="/admin/assets" style={{ color: "inherit" }}>素材库</Link>, style: adminLayoutStyle.menuItem },
            { key: "/admin/settings", icon: <SettingOutlined />, label: <Link href="/admin/settings" style={{ color: "inherit" }}>系统设置</Link>, style: adminLayoutStyle.menuItem },
          ]}
        />
        <Flex vertical gap={8} style={{ position: "absolute", bottom: 0, insetInline: 0, padding: 12, borderTop: `1px solid ${antToken.colorBorder}`, background: antToken.colorBgContainer }}>
          <Button block icon={<HomeOutlined />} href="/canvas" target="_blank" rel="noreferrer">前往画布</Button>
          <Button block icon={<LogoutOutlined />} onClick={logout}>退出登录</Button>
        </Flex>
      </Layout.Sider>
      <Layout style={{ background: antToken.colorBgLayout }}>
        <Layout.Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: adminLayoutStyle.headerHeight, padding: "0 24px", background: antToken.colorBgContainer, borderBottom: `1px solid ${antToken.colorBorder}` }}>
          <Typography.Title level={5} style={{ margin: 0 }}>{pageTitle}</Typography.Title>
          <Flex align="center" gap={4}>
            <UserStatusActions
              version={appVersion}
              theme={colorTheme}
              onThemeChange={setTheme}
              showConfig={false}
              userName={user.username}
              menuItems={[{ key: "logout", icon: <LogOut className="size-4" />, label: "退出登录", onClick: logout }]}
            />
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ minHeight: 0, overflow: "auto" }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
