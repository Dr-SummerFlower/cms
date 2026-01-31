import {Button, Form, Input, Select, Space} from 'antd';
import type {ConcertStatus} from '../../types';

interface Props {
  value: { search?: string; status?: ConcertStatus };
  onChange: (val: { search?: string; status?: ConcertStatus }) => void;
  onSubmit: () => void;
}

const statusOptions: Array<{ label: string; value: ConcertStatus }> = [
  {label: "即将开始", value: "upcoming"},
  {label: "进行中", value: "ongoing"},
  {label: "已结束", value: "completed"},
];

export default function SearchFilter({
                                       value,
                                       onChange,
                                       onSubmit,
                                     }: Props): JSX.Element {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="inline"
      initialValues={value}
      onFinish={onSubmit}
      style={{marginBottom: 16}}
    >
      <Form.Item name="search" label="搜索">
        <Input
          allowClear
          placeholder="按名称搜索"
          onChange={(e) => onChange({...value, search: e.target.value})}
        />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select
          allowClear
          options={statusOptions}
          onChange={(v) => onChange({...value, status: v})}
          style={{width: 160}}
          placeholder="全部"
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              onChange({});
              onSubmit();
            }}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
