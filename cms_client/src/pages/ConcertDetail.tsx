import {
  CalendarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Col,
  Divider,
  Grid,
  Row,
  Skeleton,
  Tag,
  theme as antdTheme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {getConcert} from "../api/concerts";
import type {Concert, ConcertStatus} from "../types";

const {Title, Text, Paragraph} = Typography;

const STATUS_CONFIG: Record<
  ConcertStatus,
  {label: string; color: string; badgeStatus: "processing" | "success" | "default"}
> = {
  upcoming: {label: "售票中", color: "blue", badgeStatus: "processing"},
  ongoing: {label: "进行中", color: "green", badgeStatus: "success"},
  completed: {label: "已结束", color: "default", badgeStatus: "default"},
};

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  const {token} = antdTheme.useToken();
  return (
    <div style={{display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0"}}>
      <span style={{color: token.colorPrimary, fontSize: 16, marginTop: 1}}>{icon}</span>
      <div>
        <Text type="secondary" style={{fontSize: 12, display: "block", lineHeight: 1.4}}>
          {label}
        </Text>
        <Text strong style={{fontSize: 15}}>
          {children}
        </Text>
      </div>
    </div>
  );
}

const NOTES = [
  "请妥善保管您的电子票，入场时需扫描二维码核验身份，请提前截图备份以防无网络。",
  "演出开始后 30 分钟将关闭入场通道，建议提前 60 分钟到场，避免因交通拥堵错过入场。",
  "场馆内禁止携带专业拍摄设备、自拍杆、激光笔等器材，安检时将予以扣留。",
  "全场禁止吸烟，请勿携带外带食品及易燃易爆危险物品进入场馆。",
  "演出期间请将手机调至静音或振动模式，尊重艺人及周围观众的观演体验。",
  "如需退票，请在演出开始前 72 小时内申请，逾期恕不受理，感谢您的理解与配合。",
];

function NotesCard(): JSX.Element {
  const {token} = antdTheme.useToken();
  return (
    <div
      style={{
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: token.borderRadiusLG,
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 10}}>
        <InfoCircleOutlined style={{color: token.colorWarning, fontSize: 14}}/>
        <Text strong style={{fontSize: 13, color: token.colorTextSecondary}}>
          温馨提示
        </Text>
      </div>
      <ul style={{margin: 0, paddingLeft: 18}}>
        {NOTES.map((note, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              color: token.colorTextSecondary,
              lineHeight: 1.8,
              marginBottom: i < NOTES.length - 1 ? 2 : 0,
            }}
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ConcertDetail(): JSX.Element {
  const {token} = antdTheme.useToken();
  const screens = Grid.useBreakpoint();
  const {id} = useParams();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      void getConcert(id)
        .then(setConcert)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{maxWidth: 1000, margin: "0 auto", padding: "24px 0"}}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <Skeleton.Image active style={{width: "100%", height: 360, borderRadius: token.borderRadiusLG}}/>
          </Col>
          <Col xs={24} md={14}>
            <Skeleton active paragraph={{rows: 8}}/>
          </Col>
        </Row>
      </div>
    );
  }

  if (!concert) return <div/>;

  const statusCfg = STATUS_CONFIG[concert.status];
  const soldPercent =
    concert.totalTickets > 0
      ? Math.round(((concert.soldTickets ?? 0) / concert.totalTickets) * 100)
      : 0;
  const remaining = concert.totalTickets - (concert.soldTickets ?? 0);

  return (
    <div style={{maxWidth: 1000, margin: "0 auto", padding: "8px 0 48px"}}>
      <Row gutter={[40, 32]} align="top">
        {/* 左栏：海报 */}
        <Col xs={24} md={10}>
          <div
            style={{
              borderRadius: token.borderRadiusLG,
              overflow: "hidden",
              boxShadow: token.boxShadowSecondary,
              position: "sticky",
              top: 24,
            }}
          >
            {concert.poster ? (
              <img
                src={concert.poster}
                alt={concert.name}
                style={{width: "100%", display: "block", objectFit: "cover"}}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  background: `linear-gradient(135deg, ${token.colorFillSecondary} 0%, ${token.colorFillTertiary} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: token.colorTextQuaternary,
                  fontSize: 16,
                }}
              >
                暂无海报
              </div>
            )}
            {/* 底部状态色条 */}
            <div
              style={{
                height: 4,
                background:
                  concert.status === "upcoming"
                    ? token.colorPrimary
                    : concert.status === "ongoing"
                      ? token.colorSuccess
                      : token.colorTextQuaternary,
              }}
            />
          </div>
          {/* 桌面端温馨提示（md 及以上） */}
          {screens.md && <NotesCard/>}
        </Col>

        {/* 右栏：信息 */}
        <Col xs={24} md={14}>
          {/* 状态 + 标题 */}
          <div style={{marginBottom: 4}}>
            <Badge status={statusCfg.badgeStatus} text={
              <Tag color={statusCfg.color} style={{fontWeight: 600, fontSize: 13}}>
                {statusCfg.label}
              </Tag>
            }/>
          </div>
          <Title level={2} style={{marginTop: 8, marginBottom: 4, lineHeight: 1.3}}>
            {concert.name}
          </Title>

          <Divider style={{margin: "16px 0"}}/>

          {/* 核心信息 */}
          <InfoItem icon={<CalendarOutlined/>} label="演出时间">
            {dayjs(concert.date).format("YYYY年MM月DD日 HH:mm")}
          </InfoItem>
          <InfoItem icon={<EnvironmentOutlined/>} label="演出场馆">
            {concert.venue}
          </InfoItem>

          <Divider style={{margin: "12px 0"}}/>

          {/* 票价 */}
          <div style={{marginBottom: 16}}>
            <Text type="secondary" style={{fontSize: 12, display: "block", marginBottom: 8}}>
              票价
            </Text>
            <div style={{display: "flex", gap: 12, flexWrap: "wrap"}}>
              <div
                style={{
                  padding: "10px 20px",
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorFillAlter,
                  textAlign: "center",
                  minWidth: 100,
                }}
              >
                <Text type="secondary" style={{fontSize: 12, display: "block"}}>成人票</Text>
                <Text strong style={{fontSize: 22, color: token.colorPrimary}}>
                  ¥{concert.adultPrice}
                </Text>
              </div>
              <div
                style={{
                  padding: "10px 20px",
                  borderRadius: token.borderRadiusLG,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorFillAlter,
                  textAlign: "center",
                  minWidth: 100,
                }}
              >
                <Text type="secondary" style={{fontSize: 12, display: "block"}}>儿童票</Text>
                <Text strong style={{fontSize: 22, color: token.colorInfo}}>
                  ¥{concert.childPrice}
                </Text>
              </div>
            </div>
          </div>

          {/* 票务信息 */}
          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "12px 0",
              flexWrap: "wrap",
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              <TeamOutlined style={{color: token.colorTextSecondary}}/>
              <Text type="secondary" style={{fontSize: 13}}>
                总票数 <Text strong>{concert.totalTickets}</Text> 张
              </Text>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              <UserOutlined style={{color: token.colorTextSecondary}}/>
              <Text type="secondary" style={{fontSize: 13}}>
                剩余 <Text strong style={{color: remaining <= 20 ? token.colorError : undefined}}>
                  {remaining}
                </Text> 张
              </Text>
            </div>
            {concert.soldTickets !== undefined && (
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <Text type="secondary" style={{fontSize: 13}}>
                  已售 {soldPercent}%
                </Text>
              </div>
            )}
          </div>

          <div style={{marginBottom: 16}}>
            <Text type="secondary" style={{fontSize: 12}}>
              单人限购：成人 {concert.maxAdultTicketsPerUser ?? 2} 张 / 儿童{" "}
              {concert.maxChildTicketsPerUser ?? 1} 张
            </Text>
          </div>

          {/* 简介 */}
          {concert.description && (
            <>
              <Divider style={{margin: "12px 0"}}/>
              <Text type="secondary" style={{fontSize: 12, display: "block", marginBottom: 6}}>
                演出简介
              </Text>
              <Paragraph
                style={{fontSize: 14, lineHeight: 1.8, color: token.colorTextSecondary}}
                ellipsis={{rows: 4, expandable: true, symbol: "展开"}}
              >
                {concert.description}
              </Paragraph>
            </>
          )}

          {/* 移动端温馨提示（sm 及以下，置于简介后） */}
          {!screens.md && <NotesCard/>}

          <Divider style={{margin: "20px 0"}}/>

          {/* 购票按钮 */}
          {concert.status === "upcoming" ? (
            <Link to={`/purchase/${concert.id}`}>
              <Button
                type="primary"
                size="large"
                block
                style={{height: 48, fontSize: 16, fontWeight: 600}}
              >
                立即购票
              </Button>
            </Link>
          ) : (
            <Button size="large" block disabled style={{height: 48}}>
              {concert.status === "ongoing" ? "演出进行中" : "演出已结束"}
            </Button>
          )}
        </Col>
      </Row>
    </div>
  );
}
