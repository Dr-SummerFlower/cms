import { App as AntdApp, Avatar, Button, Card, Descriptions, Form, Input, Space, Tabs, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React from 'react';
import { sendEmailCode } from '../api/auth';
import { updateUser, uploadAvatar } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import type { UpdateUserDto } from '../types';

export default function UserProfile(): JSX.Element {
  const { message } = AntdApp.useApp();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [avatarFile, setAvatarFile] = React.useState<File | undefined>();
  const [avatarList, setAvatarList] = React.useState<UploadFile[]>([]);
  const [savingAvatar, setSavingAvatar] = React.useState(false);

  const [baseForm] = Form.useForm<{ username?: string }>();
  const [secForm] = Form.useForm<{ email?: string; emailCode?: string; newPassword?: string }>();

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
    } catch { message.error('更新失败'); } finally { setSavingAvatar(false); }
  };

  const onSaveBase = async (vals: { username?: string }): Promise<void> => {
    if (!vals.username || vals.username.trim() === user.username) { message.info('没有变更'); return; }
    try {
      const updated = await updateUser(user.id, { username: vals.username.trim() } satisfies UpdateUserDto);
      setUser(updated);
      message.success('已更新用户名');
    } catch { message.error('更新失败'); }
  };

  const onSaveSecurity = async (vals: { email?: string; emailCode?: string; newPassword?: string }): Promise<void> => {
    const dto: UpdateUserDto = {};
    if (vals.email) dto.email = vals.email.trim();
    if (vals.newPassword) dto.password = vals.newPassword;
    if (dto.email || dto.password) dto.emailCode = vals.emailCode?.trim();
    if (!dto.email && !dto.password) { message.info('没有变更'); return; }
    if ((dto.email || dto.password) && !dto.emailCode) { message.error('需要验证码'); return; }

    try {
      const updated = await updateUser(user.id, dto);
      setUser(updated);
      message.success('安全信息已更新');
      secForm.resetFields(['emailCode', 'newPassword']);
    } catch { message.error('更新失败'); }
  };

  return (
    <Card title="个人资料" style={{ maxWidth: 960, margin: '0 auto' }}>
      <Descriptions column={3} bordered items={[
        { key: 'u', label: '用户名', children: user.username },
        { key: 'e', label: '邮箱', children: user.email },
        { key: 'r', label: '角色', children: user.role },
      ]} />

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'base',
            label: '基本资料',
            children: (
              <Form form={baseForm} layout="vertical" initialValues={{ username: user.username }} onFinish={onSaveBase}>
                <Form.Item label="用户名" name="username" rules={[{ required: true }, { min: 4, max: 20 }]}>
                  <Input placeholder="4-20个字符" />
                </Form.Item>
                <Button type="primary" htmlType="submit">保存</Button>
              </Form>
            )
          },
          {
            key: 'security',
            label: '安全设置',
            children: (
              <Form form={secForm} layout="vertical" onFinish={onSaveSecurity}>
                <Form.Item label="新邮箱" name="email" rules={[{ type: 'email' }]}><Input placeholder="更换邮箱（可选）" /></Form.Item>
                <Form.Item label="新密码" name="newPassword" rules={[{ min: 8, message: '至少 8 位' }]}><Input.Password placeholder="新密码（可选）" /></Form.Item>
                <Form.Item label="邮箱验证码" name="emailCode">
                  <Space.Compact style={{ width: '100%' }}>
                    <Input placeholder="若修改邮箱或密码需要验证码" maxLength={6} />
                    <Button onClick={() => void sendUpdateCode()} type="primary">发送验证码</Button>
                  </Space.Compact>
                </Form.Item>
                <Button type="primary" htmlType="submit">保存安全设置</Button>
              </Form>
            )
          },
          {
            key: 'avatar',
            label: '头像',
            children: (
              <>
                <Space align="center" size="large" style={{ marginBottom: 12 }}>
                  <Avatar src={user.avatar} size={64}>{user.username.at(0)}</Avatar>
                  <span>当前头像</span>
                </Space>
                <Upload listType="picture-card" accept="image/*" beforeUpload={beforeUpload} onRemove={onRemove} fileList={avatarList} maxCount={1}>
                  {avatarList.length >= 1 ? null : '选择新头像'}
                </Upload>
                <Button type="primary" onClick={() => void onSaveAvatar()} disabled={!avatarFile} loading={savingAvatar}>保存头像</Button>
              </>
            )
          }
        ]}
      />
    </Card>
  );
}
