import {Button, Card, Tag, theme as antdTheme} from "antd";
import dayjs from "dayjs";
import React from "react";
import {Link} from "react-router-dom";
import type {Concert, ConcertStatus} from "../../types";

const STATUS_CONFIG: Record<
  ConcertStatus,
  { label: string; tagColor: string; dateTagColor: string }
> = {
  upcoming: {label: "售票中", tagColor: "processing", dateTagColor: "blue"},
  ongoing: {label: "进行中", tagColor: "success", dateTagColor: "green"},
  completed: {label: "已结束", tagColor: "default", dateTagColor: "default"},
};

interface Props {
  concert: Concert;
}

export default function ConcertCard({concert}: Props): JSX.Element {
  const {token} = antdTheme.useToken();
  const dateText = dayjs(concert.date).format("YYYY年MM月DD日 HH:mm");
  const statusCfg = STATUS_CONFIG[concert.status];

  const coverContent = concert.poster ? (
    <div style={{height: "200px", overflow: "hidden"}}>
      <img
        src={concert.poster}
        alt={concert.name}
        loading="lazy"
        style={{width: "100%", height: "100%", objectFit: "cover"}}
      />
    </div>
  ) : (
    <div
      style={{
        height: "200px",
        backgroundColor: token.colorFillSecondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: token.colorTextPlaceholder,
      }}
    >
      暂无海报
    </div>
  );

  return (
    <Card
      hoverable
      cover={
        <div style={{position: "relative"}}>
          {coverContent}
          <Tag
            color={statusCfg.tagColor}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              margin: 0,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {statusCfg.label}
          </Tag>
        </div>
      }
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      styles={{
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px",
        },
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px",
          }}
        >
          <strong
            style={
              {
                fontSize: "16px",
                lineHeight: "1.4",
                flex: 1,
                marginRight: "8px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                color: token.colorText,
              } as React.CSSProperties
            }
          >
            {concert.name}
          </strong>
          <Tag color={statusCfg.dateTagColor} style={{flexShrink: 0}}>
            {dateText}
          </Tag>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: token.colorTextSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          场馆：{concert.venue}
        </div>

        <div style={{marginBottom: "12px"}}>
          票价：
          <Tag color="geekblue" style={{margin: "0 4px 0 4px"}}>
            成人 ¥{concert.adultPrice}
          </Tag>
          <Tag color="cyan">儿童 ¥{concert.childPrice}</Tag>
        </div>

        <div style={{marginTop: "auto"}}>
          <Link to={`/concerts/${concert.id}`}>
            <Button type="primary" block>
              查看详情
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
