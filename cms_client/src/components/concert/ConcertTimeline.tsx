import {EnvironmentOutlined, LoadingOutlined} from "@ant-design/icons";
import {Tag, theme as antdTheme, Tooltip, Typography} from "antd";
import dayjs from "dayjs";
import {useEffect, useRef, useState} from "react";
import {Link} from "react-router-dom";
import {listConcerts} from "../../api/concerts";
import type {Concert, ConcertStatus} from "../../types";

const {Text} = Typography;

const STATUS_CONFIG: Record<
  ConcertStatus,
  {label: string; tagColor: string; dotColor: string; dim: boolean}
> = {
  completed: {label: "已结束", tagColor: "default", dotColor: "#bfbfbf", dim: true},
  ongoing: {label: "进行中", tagColor: "success", dotColor: "#52c41a", dim: false},
  upcoming: {label: "售票中", tagColor: "processing", dotColor: "#1677ff", dim: false},
};

interface TimelineNodeProps {
  concert: Concert;
  isLast: boolean;
}

function TimelineNode({concert, isLast}: TimelineNodeProps): JSX.Element {
  const {token} = antdTheme.useToken();
  const cfg = STATUS_CONFIG[concert.status];
  const dateText = dayjs(concert.date).format("MM月DD日 HH:mm");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: isLast ? "0 0 auto" : 1,
        minWidth: 0,
        position: "relative",
      }}
    >
      {/* 连接线（除最后一个节点外） */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: "50%",
            width: "100%",
            height: 2,
            background: `linear-gradient(to right, ${cfg.dotColor}, ${token.colorBorderSecondary})`,
            zIndex: 0,
          }}
        />
      )}

      {/* 海报缩略图 + 圆点 */}
      <Link to={`/concerts/${concert.id}`}>
        <div
          style={{
            width: 112,
            borderRadius: token.borderRadiusLG,
            overflow: "hidden",
            border: `2px solid ${cfg.dim ? token.colorBorder : cfg.dotColor}`,
            boxShadow: cfg.dim ? "none" : `0 0 0 3px ${cfg.dotColor}33`,
            opacity: cfg.dim ? 0.6 : 1,
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            zIndex: 1,
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLElement).style.boxShadow = cfg.dim
              ? "none"
              : `0 6px 16px ${cfg.dotColor}55`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = cfg.dim
              ? "none"
              : `0 0 0 3px ${cfg.dotColor}33`;
          }}
        >
          {concert.poster ? (
            <img
              src={concert.poster}
              alt={concert.name}
              loading="lazy"
              style={{width: "100%", height: 72, objectFit: "cover", display: "block"}}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 72,
                background: token.colorFillSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: token.colorTextQuaternary,
              }}
            >
              暂无海报
            </div>
          )}
          {/* 状态色条 */}
          <div style={{height: 3, background: cfg.dotColor}}/>
        </div>
      </Link>

      {/* 节点圆点（连线锚点） */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: cfg.dim ? token.colorTextQuaternary : cfg.dotColor,
          border: `2px solid ${token.colorBgContainer}`,
          margin: "6px 0",
          zIndex: 1,
          position: "relative",
          boxShadow: cfg.dim ? "none" : `0 0 0 3px ${cfg.dotColor}33`,
        }}
      />

      {/* 节点文字信息 */}
      <div
        style={{
          textAlign: "center",
          padding: "0 4px",
          opacity: cfg.dim ? 0.55 : 1,
          maxWidth: 140,
        }}
      >
        <Tag color={cfg.tagColor} style={{marginBottom: 5, fontSize: 11}}>
          {cfg.label}
        </Tag>
        <Link to={`/concerts/${concert.id}`}>
          <Tooltip title={concert.name}>
            <Text
              strong
              style={{
                display: "block",
                fontSize: 12,
                lineHeight: 1.4,
                marginBottom: 3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 120,
              }}
            >
              {concert.name}
            </Text>
          </Tooltip>
        </Link>
        <Text type="secondary" style={{fontSize: 11, display: "block", marginBottom: 2}}>
          {dateText}
        </Text>
        <Text
          type="secondary"
          style={{
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <EnvironmentOutlined/>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 100,
            }}
          >
            {concert.venue}
          </span>
        </Text>
      </div>
    </div>
  );
}

export default function ConcertTimeline(): JSX.Element {
  const {token} = antdTheme.useToken();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [pastRes, upcomingRes] = await Promise.all([
          // 优先取进行中，若无则取最近已结束
          listConcerts({page: 1, limit: 1, status: "ongoing"}).then(async (r) => {
            if (r.items.length > 0) return r;
            return listConcerts({page: 1, limit: 1, status: "completed"});
          }),
          listConcerts({page: 1, limit: 4, status: "upcoming"}),
        ]);

        const merged = [
          ...pastRes.items,
          ...upcomingRes.items,
        ].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

        setConcerts(merged);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: "24px 28px",
        marginBottom: 32,
      }}
    >
      {/* 标题行 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 4,
            height: 18,
            borderRadius: 2,
            background: token.colorPrimary,
          }}
        />
        <Text strong style={{fontSize: 15}}>
          近期演出
        </Text>
        <Text type="secondary" style={{fontSize: 13}}>
          · 按时间排列
        </Text>
      </div>

      {/* 时间轴主体 */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 120,
            color: token.colorTextSecondary,
            gap: 8,
          }}
        >
          <LoadingOutlined/>
          <span>加载中...</span>
        </div>
      ) : concerts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: token.colorTextSecondary,
            padding: "32px 0",
            fontSize: 13,
          }}
        >
          暂无近期演出
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            overflowX: "auto",
            paddingBottom: 8,
            /* 隐藏滚动条但保留功能 */
            scrollbarWidth: "thin",
            scrollbarColor: `${token.colorBorderSecondary} transparent`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              minWidth: concerts.length * 148,
              paddingTop: 8,
            }}
          >
            {concerts.map((c, idx) => (
              <TimelineNode
                key={c.id}
                concert={c}
                isLast={idx === concerts.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
