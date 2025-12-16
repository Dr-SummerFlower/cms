import { Button, Card, Tag } from "antd";
import dayjs from "dayjs";
import React from "react";
import { Link } from "react-router-dom";
import type { Concert } from "../../types";

interface Props {
  concert: Concert;
}

export default function ConcertCard({ concert }: Props): JSX.Element {
  const dateText = dayjs(concert.date).format("YYYY年MM月DD日 HH:mm");

  return (
    <Card
      hoverable
      cover={
        concert.poster ? (
          <div style={{ height: "200px", overflow: "hidden" }}>
            <img
              src={concert.poster}
              alt={concert.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              height: "200px",
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
            }}
          >
            暂无海报
          </div>
        )
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
              } as React.CSSProperties
            }
          >
            {concert.name}
          </strong>
          <Tag color="blue" style={{ flexShrink: 0 }}>
            {dateText}
          </Tag>
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#666",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          场馆：{concert.venue}
        </div>

        <div style={{ marginBottom: "12px" }}>
          票价：
          <Tag color="geekblue" style={{ margin: "0 4px 0 4px" }}>
            成人 ¥{concert.adultPrice}
          </Tag>
          <Tag color="cyan">儿童 ¥{concert.childPrice}</Tag>
        </div>

        <div style={{ marginTop: "auto" }}>
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
