import {
  CalendarOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import {Card, Col, Grid, Row, Statistic, theme as antdTheme} from "antd";
import {useEffect, useState} from "react";
import {listConcerts} from "../../api/concerts";

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
}

export default function StatsBar(): JSX.Element {
  const {token} = antdTheme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void (async () => {
      const [all, upcoming, completed] = await Promise.all([
        listConcerts({page: 1, limit: 1}),
        listConcerts({page: 1, limit: 1, status: "upcoming"}),
        listConcerts({page: 1, limit: 1, status: "completed"}),
      ]);
      setStats({
        total: all.total,
        upcoming: upcoming.total,
        completed: completed.total,
      });
    })();
  }, []);

  const items = [
    {
      fullTitle: "全部演唱会",
      shortTitle: "全部",
      value: stats?.total,
      icon: <CalendarOutlined style={{fontSize: isMobile ? 18 : 24, color: token.colorPrimary}}/>,
      color: token.colorPrimary,
    },
    {
      fullTitle: "售票中",
      shortTitle: "售票中",
      value: stats?.upcoming,
      icon: <ShoppingOutlined style={{fontSize: isMobile ? 18 : 24, color: token.colorSuccess}}/>,
      color: token.colorSuccess,
    },
    {
      fullTitle: "已结束",
      shortTitle: "已结束",
      value: stats?.completed,
      icon: <CheckCircleOutlined style={{fontSize: isMobile ? 18 : 24, color: token.colorTextQuaternary}}/>,
      color: token.colorTextQuaternary,
    },
  ];

  return (
    <Row gutter={[12, 12]} style={{marginBottom: 32}} align="stretch">
      {items.map((item) => (
        <Col key={item.fullTitle} xs={8} sm={8} md={8} style={{display: "flex"}}>
          <Card
            style={{
              borderRadius: token.borderRadiusLG,
              borderTop: `3px solid ${item.color}`,
              width: "100%",
            }}
            styles={{body: {padding: isMobile ? "12px 10px" : "16px 20px", height: "100%"}}}
          >
            {isMobile ? (
              /* 移动端：纵向紧凑布局 */
              <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 4}}>
                {item.icon}
                <span style={{fontSize: 20, fontWeight: 700, color: item.color, lineHeight: 1.2}}>
                  {item.value ?? "-"}
                </span>
                <span style={{fontSize: 11, color: token.colorTextSecondary, textAlign: "center", lineHeight: 1.3}}>
                  {item.shortTitle}
                </span>
              </div>
            ) : (
              /* 桌面端：横向布局 */
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                {item.icon}
                <Statistic
                  title={
                    <span style={{fontSize: 13, color: token.colorTextSecondary}}>
                      {item.fullTitle}
                    </span>
                  }
                  value={item.value ?? "-"}
                  valueStyle={{fontSize: 24, fontWeight: 700, color: item.color}}
                />
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
