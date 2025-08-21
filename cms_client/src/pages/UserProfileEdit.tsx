import { App as AntdApp, Avatar, Button, Card, Form, Input, Space, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React from 'react';
import { Link } from 'react-router-dom';
import { sendEmailCode } from '../api/auth';
import { updateUser, uploadAvatar } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import type { UpdateUserDto } from '../types';

export default function UserProfileEdit(): JSX.Element {
  const { message } = AntdApp.useApp();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [avatarFile, setAvatarFile] = React.useState<File | undefined>();
  const [avatarList, setAvatarList] = React.useState<UploadFile[]>([]);
  const [savingAvatar, setSavingAvatar] = React.useState(false);

  const [baseForm] = Form.useForm<{ username?: string }>();
  const [secForm] = Form.useForm<{ email?: string; emailCode?: string; password?: string; newPassword?: string }>();

  if (!user) return <Card loading />;

  const beforeUpload = (f: File) => {
    if (!f.type.startsWith('image/')) { message.error('请上传图片文件'); return Upload.LIST_IGNORE; }
    if (f.size > 5 * 1024 * 1024) { message.error('图片不能超过 5MB'); return Upload.LIST_IGNORE; }
    setAvatarFile(f);
    setAvatarList([{ uid: String(Date.now()), name: f.name, status: 'done', thumbUrl: URL.createObjectURL(f) }]);
    return false;
  };
  const onRemove = () => { setAvatarFile(undefined); setAvatarList([]); return true; };

  const sendUpdateCode = async (): Promise<void> => {
    const email = secForm.getFieldValue('email') as string | undefined;
    if (!email) { message.warning('请先填写新邮箱'); return; }
    try { await sendEmailCode(email, 'update'); message.success('验证码已发送'); } catch { message.error('发送失败'); }
  };

  const onSaveAvatar = async (): Promise<void> => {
    if (!avatarFile) { message.error('请先选择图片'); return; }
    try {
      setSavingAvatar(true);
      const updated = await uploadAvatar(user.id, avatarFile);
      setUser(updated);
      message.success('头像已更新');
    } catch { message.error('更新失败'); }
    finally { setSavingAvatar(false); }
  };

  const onSaveBase = async (v: { username?: string }): Promise<void> => {
    const name = v.username?.trim();
    if (!name || name === user.username) { message.info('没有需要保存的更改'); return; }
    try {
      const updated = await updateUser(user.id, { username: name } satisfies UpdateUserDto);
      setUser(updated);
      message.success('已保存');
      baseForm.resetFields();
    } catch { message.error('保存失败'); }
  };

  const onSaveSecurity = async (v: { email?: string; emailCode?: string; password?: string; newPassword?: string }): Promise<void> => {
    const patch: UpdateUserDto = {};
    const email = v.email?.trim();
    const emailCode = v.emailCode?.trim();
    const password = v.password;
    const newPassword = v.newPassword;

    if (email) {
      patch.email = email;
      if (!emailCode) { message.error('修改邮箱需要验证码'); return; }
      patch.emailCode = emailCode;
    }

    if (newPassword) {
      if (!password) { message.error('修改密码需要输入当前密码'); return; }
      patch.password = password;
      patch.newPassword = newPassword;
    }

    if (Object.keys(patch).length === 0) { message.info('没有需要保存的更改'); return; }

    try {
      const updated = await updateUser(user.id, patch);
      setUser(updated);
      message.success('已保存');
      secForm.resetFields(['emailCode', 'password', 'newPassword']);
    } catch { message.error('保存失败'); }
  };

  return (
    <Card title="编辑个人资料" style={{ maxWidth: 960, margin: '0 auto' }}
          extra={<Link to="/me/profile"><Button>返回</Button></Link>}>
      <Space align="center" size="large" style={{ marginBottom: 12 }}>
        <Avatar src={user.avatar} size={64}>{user.username.at(0)}</Avatar>
        <span>当前头像</span>
      </Space>
      
      <div style={{ marginBottom: 16 }}>
        <Upload
          listType="picture-card"
          accept="image/*"
          beforeUpload={beforeUpload}
          onRemove={onRemove}
          fileList={avatarList}
          maxCount={1}
        >
          {avatarList.length >= 1 ? null : '选择新头像'}
        </Upload>
      </div>

      <Button
        type="primary"
        onClick={() => void onSaveAvatar()}
        disabled={!avatarFile}
        loading={savingAvatar}
        style={{ marginBottom: 24 }}
      >
        保存头像
      </Button>

      <Form form={baseForm} layout="vertical" initialValues={{ username: user.username }} onFinish={onSaveBase}>
        <Form.Item label="用户名" name="username" rules={[{ required: true }, { min: 4, max: 20 }]}><Input placeholder="4-20个字符" /></Form.Item>
        <Button type="primary" htmlType="submit">保存基本资料</Button>
      </Form>

      <div style={{ height: 16 }} />

      <Form form={secForm} layout="vertical" onFinish={onSaveSecurity}>
        <Form.Item label="新邮箱" name="email" rules={[{ type: 'email' }]}><Input placeholder="更换邮箱（可选）" /></Form.Item>
        <Form.Item label="邮箱验证码" name="emailCode">
          <Space.Compact style={{ width: '100%' }}>
            <Input placeholder="若修改邮箱需要验证码" maxLength={6} />
            <Button onClick={() => void sendUpdateCode()} type="primary">发送验证码</Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item label="当前密码" name="password" rules={[{ min: 8, message: '至少 8 位' }]}>
          <Input.Password placeholder="修改密码时必填当前密码" />
        </Form.Item>
        <Form.Item label="新密码" name="newPassword" rules={[{ min: 8, message: '至少 8 位' }]}>
          <Input.Password placeholder="新密码（可选）" />
        </Form.Item>

        <Button type="primary" htmlType="submit">保存安全设置</Button>
      </Form>
    </Card>
  );
}
