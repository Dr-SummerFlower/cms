import { Layout } from "antd";

const { Footer } = Layout;

export default function AppFooter(): JSX.Element {
  return (
    <Footer style={{ textAlign: "center" }}>
      © {new Date().getFullYear()} 演唱会管理系统
    </Footer>
  );
}
