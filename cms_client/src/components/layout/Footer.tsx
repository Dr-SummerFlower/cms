import { useEffect, useState } from "react";
import { Layout } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { getHealth } from "../../api/health";

const { Footer } = Layout;

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} 天`);
  if (h > 0) parts.push(`${h} 小时`);
  if (m > 0) parts.push(`${m} 分钟`);
  parts.push(`${s} 秒`);
  return parts.join(" ");
}

export default function AppFooter(): JSX.Element {
  const [uptime, setUptime] = useState<number | null>(null);

  useEffect(() => {
    let tick: ReturnType<typeof setInterval>;
    let sync: ReturnType<typeof setInterval>;

    async function syncUptime() {
      try {
        const { uptime: seconds } = await getHealth();
        setUptime(seconds);
      } catch {
        // silently ignore — backend may not be reachable
      }
    }

    syncUptime();
    // increment locally every second for smooth display
    tick = setInterval(() => setUptime((prev) => (prev !== null ? prev + 1 : prev)), 1_000);
    // re-sync with server every 5 minutes to correct drift
    sync = setInterval(syncUptime, 5 * 60_000);

    return () => {
      clearInterval(tick);
      clearInterval(sync);
    };
  }, []);

  return (
    <Footer style={{ textAlign: "center", color: "rgba(0,0,0,0.45)" }}>
      <div>© {new Date().getFullYear()} 演唱会管理系统</div>
      {uptime !== null && (
        <div style={{ marginTop: 4, fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          服务运行时间：{formatUptime(uptime)}
        </div>
      )}
    </Footer>
  );
}
