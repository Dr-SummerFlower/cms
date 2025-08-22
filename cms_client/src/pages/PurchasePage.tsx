import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Form,
  InputNumber,
  Space,
  Statistic,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConcert } from '../api/concerts';
import { createOrder, myTickets } from '../api/tickets';
import type { Concert, CreateTicketOrderDto, TicketItem } from '../types';

export default function PurchasePage(): JSX.Element {
  const { id } = useParams();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [ownedAdult, setOwnedAdult] = useState<number>(0);
  const [ownedChild, setOwnedChild] = useState<number>(0);
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<{ adultQty?: number; childQty?: number }>();

  useEffect(() => {
    (async () => {
      if (!id) return;
      const c = await getConcert(id);
      setConcert(c);
      try {
        const mine = await myTickets({ status: 'valid', concertId: id });
        const counts = mine.reduce<{ adult: number; child: number }>((acc, t: TicketItem) => {
          if (t.type === 'adult') acc.adult += 1;
          if (t.type === 'child') acc.child += 1;
          return acc;
        }, { adult: 0, child: 0 });
        setOwnedAdult(counts.adult);
        setOwnedChild(counts.child);
      } catch {
        setOwnedAdult(0);
        setOwnedChild(0);
      }
    })();
  }, [id]);

  const adultQty = Form.useWatch('adultQty', form) ?? 0;
  const childQty = Form.useWatch('childQty', form) ?? 0;

  const maxAdult = concert?.maxAdultTicketsPerUser ?? 2;
  const maxChild = concert?.maxChildTicketsPerUser ?? 1;

  const remainAdult = Math.max(0, maxAdult - ownedAdult);
  const remainChild = Math.max(0, maxChild - ownedChild);

  const total = useMemo(() => {
    if (!concert) return 0;
    return adultQty * concert.adultPrice + childQty * concert.childPrice;
  }, [concert, adultQty, childQty]);

  if (!concert)
    return <Card loading style={{ maxWidth: 720, margin: '24px auto' }} />;

  const onFinish = async (vals: { adultQty?: number; childQty?: number }): Promise<void> => {
    const a = Number(vals.adultQty ?? 0);
    const c = Number(vals.childQty ?? 0);
    if (a > remainAdult || c > remainChild) {
      message.error('超过个人剩余额度，请调整张数');
      return;
    }
    if (a + c <= 0) {
      message.warning('请选择至少 1 张票');
      return;
    }
    if (!id) return;
    const dto: CreateTicketOrderDto = {
      concertId: id,
      tickets: [
        ...(a > 0 ? [{ type: 'adult' as const, quantity: a }] : []),
        ...(c > 0 ? [{ type: 'child' as const, quantity: c }] : []),
      ],
    };
    try {
      await createOrder(dto);
      message.success('下单成功，电子票已生成');
      navigate('/me/tickets', { replace: true });
    } catch {
      message.error('下单失败，请稍后再试');
    }
  };

  return (
    <Card
      title="确认购票"
      style={{ maxWidth: 720, margin: '24px auto' }}
      extra={
        <Typography.Text type="secondary">
          {new Date(concert.date).toLocaleString()}
        </Typography.Text>
      }
    >
      <Descriptions
        column={1}
        bordered
        size="small"
        items={[
          { key: 'name', label: '演唱会', children: concert.name },
          { key: 'venue', label: '场馆', children: concert.venue },
          {
            key: 'limit',
            label: '单人限购',
            children: `成人 ${maxAdult} / 儿童 ${maxChild}`,
          },
          {
            key: 'remain',
            label: '剩余额度',
            children: `成人 ${remainAdult} / 儿童 ${remainChild}`,
          },
        ]}
      />

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 12 }}
        message="购票须知"
        description="每位用户的购买上限受“单人限购”约束；若超出将无法提交订单。当前按剩余额度计算。"
      />

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        initialValues={{ adultQty: 0, childQty: 0 }}
        onFinish={onFinish}
      >
        <Space size="large" wrap>
          <Form.Item
            label={`成人票（¥${concert.adultPrice}）`}
            name="adultQty"
            rules={[{ type: 'number', min: 0, message: '请输入不小于 0 的整数' }]}
            help={`单人最多 ${maxAdult} 张，剩余可购 ${remainAdult} 张`}
          >
            <InputNumber min={0} max={remainAdult} style={{ width: 160 }} />
          </Form.Item>

          <Form.Item
            label={`儿童票（¥${concert.childPrice}）`}
            name="childQty"
            rules={[{ type: 'number', min: 0, message: '请输入不小于 0 的整数' }]}
            help={`单人最多 ${maxChild} 张，剩余可购 ${remainChild} 张`}
          >
            <InputNumber min={0} max={remainChild} style={{ width: 160 }} />
          </Form.Item>

          <Statistic title="合计金额" value={total} prefix="¥" />
        </Space>

        <Button
          type="primary"
          htmlType="submit"
          block
          disabled={adultQty + childQty <= 0}
          style={{ marginTop: 12 }}
        >
          立即支付并出票
        </Button>
      </Form>
    </Card>
  );
}
