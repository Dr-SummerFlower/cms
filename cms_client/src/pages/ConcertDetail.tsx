import { Button, Card, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getConcert } from '../api/concerts';
import type { Concert } from '../types';

export default function ConcertDetail(): JSX.Element {
  const { id } = useParams();
  const [concert, setConcert] = useState<Concert | null>(null);

  useEffect(() => {
    if (id) {
      void getConcert(id).then(setConcert);
    }
  }, [id]);

  if (!concert) return <Card loading />;

  return (
    <Card title={concert.name}>
      <Space direction="vertical" size={12}>
        <div>时间：<Tag>{dayjs(concert.date).format('YYYY-MM-DD HH:mm')}</Tag></div>
        <div>场馆：{concert.venue}</div>
        <div>票价：成人 ¥{concert.adultPrice}｜儿童 ¥{concert.childPrice}</div>
        <div>单人限购：成人 {concert.maxAdultTicketsPerUser ?? 2} / 儿童 {concert.maxChildTicketsPerUser ?? 1}</div>
        <div>总票数：{concert.totalTickets}</div>
        <Button type="primary">
          <Link to={`/purchase/${concert.id}`}>立即购票</Link>
        </Button>
      </Space>
    </Card>
  );
}
