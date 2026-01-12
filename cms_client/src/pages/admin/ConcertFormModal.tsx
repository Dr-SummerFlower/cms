import { InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App as AntdApp,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Tooltip,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import type { Concert, CreateConcertDto } from "../../types";
import { getImageUrl } from "../../utils/image";

interface Props {
  open: boolean;
  onCancel: () => void;
  onOk: (dto: CreateConcertDto, poster: File | undefined) => void;
  initial?: Partial<Concert> | null;
}

type CreateForm = Omit<CreateConcertDto, "date" | "poster"> & { date?: Dayjs };

export default function ConcertFormModal({
  open,
  onCancel,
  onOk,
  initial,
}: Props) {
  const [form] = Form.useForm<CreateForm>();
  const { message } = AntdApp.useApp();
  const [posterList, setPosterList] = useState<UploadFile[]>([]);
  const [posterFile, setPosterFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    form.setFieldsValue({
      name: initial?.name,
      date: initial?.date ? dayjs(initial.date) : undefined,
      venue: initial?.venue,
      adultPrice: initial?.adultPrice ?? 0,
      childPrice: initial?.childPrice ?? 0,
      totalTickets: initial?.totalTickets ?? 0,
      maxAdultTicketsPerUser: initial?.maxAdultTicketsPerUser ?? 2,
      maxChildTicketsPerUser: initial?.maxChildTicketsPerUser ?? 1,
      description: initial?.description,
    });

    if (initial?.poster) {
      setPosterList([
        {
          uid: "-1",
          name: "poster",
          status: "done",
          url: getImageUrl(initial.poster),
        } as UploadFile,
      ]);
    } else {
      setPosterList([]);
    }
  }, [form, initial, open]);

  const handleBeforeUpload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!file.type.startsWith("image/")) {
        message.error("请上传图片文件");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error("图片大小不能超过 5MB");
        return false;
      }
      setPosterFile(file);
      setPosterList([
        {
          uid: String(Date.now()),
          name: file.name,
          status: "done",
          thumbUrl: URL.createObjectURL(file),
        },
      ]);
      return false;
    },
    [message],
  );

  const handleRemove = useCallback(() => {
    setPosterFile(undefined);
    setPosterList([]);
    return true;
  }, []);

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传海报</div>
    </div>
  );

  const onFinish = (vals: CreateForm): void => {
    const dto: CreateConcertDto = {
      name: vals.name?.trim() ?? "",
      date: vals.date ? vals.date.toISOString() : "",
      venue: vals.venue?.trim() ?? "",
      adultPrice: Number(vals.adultPrice ?? 0),
      childPrice: Number(vals.childPrice ?? 0),
      totalTickets: Number(vals.totalTickets ?? 0),
      maxAdultTicketsPerUser: Number(vals.maxAdultTicketsPerUser ?? 2),
      maxChildTicketsPerUser: Number(vals.maxChildTicketsPerUser ?? 1),
      description: vals.description ?? "",
    };
    if (!initial?.id && !posterFile) {
      message.error("请上传海报");
      return;
    }
    onOk(dto, posterFile);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      title={initial?.id ? "编辑演唱会" : "新建演唱会"}
      destroyOnHidden
    >
      <Form<CreateForm> form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="演唱会名称" />
        </Form.Item>

        <Form.Item label="海报" tooltip="请上传图片">
          <Upload
            listType="picture-card"
            accept="image/*"
            fileList={posterList}
            beforeUpload={handleBeforeUpload}
            onRemove={handleRemove}
            maxCount={1}
          >
            {posterList.length >= 1 ? null : uploadButton}
          </Upload>
        </Form.Item>

        <Form.Item
          label="时间"
          name="date"
          rules={[{ required: true, message: "请选择时间" }]}
        >
          <DatePicker
            showTime
            style={{ width: "100%" }}
            placeholder="选择日期与时间"
          />
        </Form.Item>

        <Form.Item
          label="场馆"
          name="venue"
          rules={[{ required: true, message: "请输入场馆" }]}
        >
          <Input placeholder="场馆名称" />
        </Form.Item>

        <Form.Item
          label="成人票价"
          name="adultPrice"
          rules={[{ required: true, message: "请输入成人票价" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="¥" />
        </Form.Item>

        <Form.Item
          label="儿童票价"
          name="childPrice"
          rules={[{ required: true, message: "请输入儿童票价" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="¥" />
        </Form.Item>

        <Form.Item
          label="总票数"
          name="totalTickets"
          rules={[{ required: true, message: "请输入总票数" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="总票量" />
        </Form.Item>

        <Form.Item
          label={
            <span>
              单人限购（成人）
              <Tooltip title="每位用户单场最多可买的成人票数量">
                <InfoCircleOutlined style={{ marginLeft: 6 }} />
              </Tooltip>
            </span>
          }
          name="maxAdultTicketsPerUser"
          rules={[{ type: "number", min: 0, message: "请输入不小于 0 的整数" }]}
        >
          <InputNumber
            min={0}
            max={20}
            style={{ width: 200 }}
            placeholder="默认 2"
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              单人限购（儿童）
              <Tooltip title="每位用户单场最多可买的儿童票数量">
                <InfoCircleOutlined style={{ marginLeft: 6 }} />
              </Tooltip>
            </span>
          }
          name="maxChildTicketsPerUser"
          rules={[{ type: "number", min: 0, message: "请输入不小于 0 的整数" }]}
        >
          <InputNumber
            min={0}
            max={20}
            style={{ width: 200 }}
            placeholder="默认 1"
          />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea rows={3} placeholder="亮点、嘉宾、入场须知…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
