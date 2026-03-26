import {Layout, Menu, theme as antdTheme} from "antd";
import {Outlet, useLocation, useNavigate} from "react-router-dom";

const {Sider, Content} = Layout;

export default function AdminLayout(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const {token} = antdTheme.useToken();

  const selected = location.pathname.startsWith("/admin/users")
    ? "users"
    : location.pathname.startsWith("/admin/refunds")
      ? "refunds"
      : "concerts";

  return (
    <Layout
      style={{
        minHeight: "calc(100vh - 64px)",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: token.colorBgLayout,
      }}
    >
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{backgroundColor: token.colorBgContainer}}
      >
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={[
            {
              key: "concerts",
              label: "演唱会管理",
              onClick: () => navigate("/admin/concerts"),
            },
            {
              key: "users",
              label: "用户管理",
              onClick: () => navigate("/admin/users"),
            },
            {
              key: "refunds",
              label: "退款审核",
              onClick: () => navigate("/admin/refunds"),
            },
          ]}
        />
      </Sider>
      <Layout style={{backgroundColor: "transparent"}}>
        <Content
          style={{
            padding: 24,
            backgroundColor: token.colorBgContainer,
            borderRadius: "0 8px 8px 0",
          }}
        >
          <Outlet/>
        </Content>
      </Layout>
    </Layout>
  );
}
