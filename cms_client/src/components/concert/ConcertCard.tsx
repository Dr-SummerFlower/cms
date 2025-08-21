import { Button, Card, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import type { Concert } from '../../types';

interface Props {
  concert: Concert;
}

export default function ConcertCard({ concert }: Props): JSX.Element {
  const dateText = dayjs(concert.date).format('YYYY年MM月DD日 HH:mm');

  return (
    <Card
      hoverable
      cover={concert.poster ? <img src={concert.poster} alt={concert.name} /> : undefined}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <strong>{concert.name}</strong>
          <Tag color="blue">{dateText}</Tag>
        </Space>
        <div>场馆：{concert.venue}</div>
        <div>
          票价：<Tag color="geekblue">成人 ¥{concert.adultPrice}</Tag>
          <Tag color="cyan">儿童 ¥{concert.childPrice}</Tag>
        </div>
        <Link to={`/concerts/${concert.id}`}>
          <Button type="primary" block>查看详情</Button>
        </Link>
      </Space>
    </Card>
  );
}
