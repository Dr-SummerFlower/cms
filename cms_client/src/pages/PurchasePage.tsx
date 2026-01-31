import {UploadOutlined} from "@ant-design/icons";
import type {UploadFile} from "antd";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Space,
  Statistic,
  Typography,
  Upload,
} from "antd";
import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {getConcert} from "../api/concerts";
import {createOrder, myTickets} from "../api/tickets";
import type {Concert, CreateTicketOrderDto, TicketAttendeeInfo, TicketItem,} from "../types";

export default function PurchasePage(): JSX.Element {
  const {id} = useParams();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [ownedAdult, setOwnedAdult] = useState<number>(0);
  const [ownedChild, setOwnedChild] = useState<number>(0);
  const {message} = AntdApp.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<{ adultQty?: number; childQty?: number }>();

  useEffect(() => {
    (async () => {
      if (!id) return;
      const c = await getConcert(id);
      setConcert(c);
      try {
        // 获取所有 valid 和 used 状态的票（与后端检查逻辑一致）
        const allTickets = await myTickets({concertId: id});
        const validAndUsedTickets = allTickets.filter(
          (t: TicketItem) => t.status === "valid" || t.status === "used",
        );
        const counts = validAndUsedTickets.reduce<{
          adult: number;
          child: number;
        }>(
          (acc, t: TicketItem) => {
            if (t.type === "adult") acc.adult += 1;
            if (t.type === "child") acc.child += 1;
            return acc;
          },
          {adult: 0, child: 0},
        );
        setOwnedAdult(counts.adult);
        setOwnedChild(counts.child);
      } catch {
        setOwnedAdult(0);
        setOwnedChild(0);
      }
    })();
  }, [id]);

  const adultQty = Form.useWatch("adultQty", form) ?? 0;
  const childQty = Form.useWatch("childQty", form) ?? 0;

  const maxAdult = concert?.maxAdultTicketsPerUser ?? 2;
  const maxChild = concert?.maxChildTicketsPerUser ?? 1;

  const remainAdult = Math.max(0, maxAdult - ownedAdult);
  const remainChild = Math.max(0, maxChild - ownedChild);

  const total = useMemo(() => {
    if (!concert) return 0;
    return adultQty * concert.adultPrice + childQty * concert.childPrice;
  }, [concert, adultQty, childQty]);

  const totalTickets = useMemo(() => adultQty + childQty, [adultQty, childQty]);

  if (!concert)
    return <Card loading style={{maxWidth: 720, margin: "24px auto"}}/>;

  const onFinish = async (vals: Record<string, unknown>): Promise<void> => {
    const a = Number(vals.adultQty ?? 0);
    const c = Number(vals.childQty ?? 0);
    if (a > remainAdult || c > remainChild) {
      message.error(
        "抱歉，您选择的票数超过了剩余可购数量，请您根据剩余额度调整购票数量，感谢您的配合。",
      );
      return;
    }
    if (a + c <= 0) {
      message.warning("请您至少选择 1 张票");
      return;
    }
    if (!id) return;

    const totalTickets = a + c;

    // 收集所有票的实名信息
    const attendees: TicketAttendeeInfo[] = [];
    const faceImages: File[] = [];

    for (let i = 0; i < totalTickets; i++) {
      const realName = vals[`attendee_${i}_realName`] as string;
      const idCard = vals[`attendee_${i}_idCard`] as string;
      const faceFileList = vals[`attendee_${i}_faceImage`] as
        | UploadFile[]
        | undefined;

      if (!realName || !idCard) {
        message.error(
          `请您填写第 ${i + 1} 张票的完整实名信息，包括姓名和身份证号，感谢您的配合。`,
        );
        return;
      }

      if (!faceFileList || faceFileList.length === 0) {
        message.error(
          `请您上传第 ${i + 1} 张票的人脸照片，以便入场时进行身份核验，感谢您的配合。`,
        );
        return;
      }

      const faceFile = faceFileList[0];
      if (!faceFile.originFileObj) {
        message.error(
          `请您上传第 ${i + 1} 张票的人脸照片，以便入场时进行身份核验，感谢您的配合。`,
        );
        return;
      }

      attendees.push({realName, idCard});
      faceImages.push(faceFile.originFileObj);
    }

    // 按票类型分组
    let attendeeIndex = 0;
    const tickets: Array<{
      type: "adult" | "child";
      quantity: number;
      attendees: TicketAttendeeInfo[];
    }> = [];

    if (a > 0) {
      tickets.push({
        type: "adult",
        quantity: a,
        attendees: attendees.slice(attendeeIndex, attendeeIndex + a),
      });
      attendeeIndex += a;
    }

    if (c > 0) {
      tickets.push({
        type: "child",
        quantity: c,
        attendees: attendees.slice(attendeeIndex, attendeeIndex + c),
      });
    }

    const dto: CreateTicketOrderDto = {
      concertId: id,
      tickets,
    };

    try {
      await createOrder(dto, faceImages);
      message.success("下单成功，电子票已生成");
      navigate("/me/tickets", {replace: true});
    } catch {
      message.error("下单失败，请稍后再试");
    }
  };

  return (
    <Card
      title="确认购票"
      style={{maxWidth: 720, margin: "24px auto"}}
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
          {key: "name", label: "演唱会", children: concert.name},
          {key: "venue", label: "场馆", children: concert.venue},
          {
            key: "limit",
            label: "单人限购",
            children: `成人 ${maxAdult} / 儿童 ${maxChild}`,
          },
          {
            key: "remain",
            label: "剩余额度",
            children: `成人 ${remainAdult} / 儿童 ${remainChild}`,
          },
        ]}
      />

      <Alert
        type="info"
        showIcon
        style={{marginTop: 12}}
        message="购票须知"
        description="为保障广大消费者的购票需求，我们对每位用户的购票数量进行了限制，对您造成的不便敬请谅解，感谢您的配合。请您根据剩余可购票数量进行购买，超出限制将无法完成下单。"
      />

      <Form
        form={form}
        layout="vertical"
        style={{marginTop: 16}}
        initialValues={{adultQty: 0, childQty: 0}}
        onFinish={onFinish}
      >
        <Space size="large" wrap>
          <Form.Item
            label={`成人票（¥${concert.adultPrice}）`}
            name="adultQty"
            rules={[
              {type: "number", min: 0, message: "请输入不小于 0 的整数"},
            ]}
            help={`限购 ${maxAdult} 张/人，您还可购买 ${remainAdult} 张`}
          >
            <InputNumber min={0} max={remainAdult} style={{width: 160}}/>
          </Form.Item>

          <Form.Item
            label={`儿童票（¥${concert.childPrice}）`}
            name="childQty"
            rules={[
              {type: "number", min: 0, message: "请输入不小于 0 的整数"},
            ]}
            help={`限购 ${maxChild} 张/人，您还可购买 ${remainChild} 张`}
          >
            <InputNumber min={0} max={remainChild} style={{width: 160}}/>
          </Form.Item>

          <Statistic title="合计金额" value={total} prefix="¥"/>
        </Space>

        {totalTickets > 0 && (
          <div style={{marginTop: 24}}>
            <Alert
              type="warning"
              showIcon
              message="实名制购票提醒"
              description="根据实名制购票要求，请您为每张票填写实际观演人的真实姓名、身份证号，并上传清晰的人脸照片。入场时将进行身份核验，信息不符将无法入场，感谢您的理解与配合。"
              style={{marginBottom: 16}}
            />
            {Array.from({length: totalTickets}).map((_, index) => {
              const ticketType = index < adultQty ? "adult" : "child";
              const ticketTypeName =
                ticketType === "adult" ? "成人票" : "儿童票";
              return (
                <Card
                  key={index}
                  size="small"
                  title={`第 ${index + 1} 张票（${ticketTypeName}）`}
                  style={{marginBottom: 16}}
                >
                  <Space
                    direction="vertical"
                    style={{width: "100%"}}
                    size="middle"
                  >
                    <Form.Item
                      label="观演人姓名"
                      name={`attendee_${index}_realName`}
                      rules={[
                        {required: true, message: "请您输入观演人的真实姓名"},
                      ]}
                    >
                      <Input placeholder="请输入与身份证一致的姓名"/>
                    </Form.Item>
                    <Form.Item
                      label="身份证号码"
                      name={`attendee_${index}_idCard`}
                      rules={[
                        {required: true, message: "请您输入身份证号码"},
                        {
                          pattern:
                            /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
                          message: "身份证号码格式不正确，请您检查后重新输入",
                        },
                      ]}
                    >
                      <Input
                        placeholder="请输入18位身份证号码"
                        maxLength={18}
                      />
                    </Form.Item>
                    <Form.Item
                      label="人脸照片"
                      name={`attendee_${index}_faceImage`}
                      rules={[
                        {
                          required: true,
                          message: "请您上传观演人的清晰人脸照片",
                        },
                      ]}
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) {
                          return e;
                        }
                        return e?.fileList;
                      }}
                    >
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        accept="image/*"
                      >
                        <div>
                          <UploadOutlined/>
                          <div style={{marginTop: 8}}>上传照片</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </Space>
                </Card>
              );
            })}
          </div>
        )}

        <Button
          type="primary"
          htmlType="submit"
          block
          disabled={adultQty + childQty <= 0}
          style={{marginTop: 12}}
        >
          立即支付并出票
        </Button>
      </Form>
    </Card>
  );
}
