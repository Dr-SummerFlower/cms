import {Avatar, Button, Card, Descriptions, Space, theme as antdTheme,} from "antd";
import {Link} from "react-router-dom";
import {useAuthStore} from "../stores/authStore";
import {getImageUrl} from "../utils/image";

export default function UserProfileView(): JSX.Element {
  const {token} = antdTheme.useToken();
  const user = useAuthStore((s) => s.user);
  if (!user) return <Card loading/>;

  return (
    <Card
      title="个人资料"
      style={{maxWidth: 960, margin: "0 auto"}}
      styles={{
        header: {
          background: token.colorPrimaryBg,
          borderBottom: `1px solid ${token.colorPrimaryBorder}`,
        },
      }}
      extra={
        <Link to="/me/profile/edit">
          <Button type="primary">编辑资料</Button>
        </Link>
      }
    >
      <Space align="center" size="large" style={{marginBottom: 12}}>
        <Avatar
          src={getImageUrl(user.avatar)}
          size={64}
          style={{border: `2px solid ${token.colorPrimary}`}}
        >
          {user.username.at(0)}
        </Avatar>
        <span>{user.username}</span>
      </Space>
      <Descriptions
        column={2}
        bordered
        items={[
          {key: "u", label: "用户名", children: user.username},
          {key: "e", label: "邮箱", children: user.email},
          {key: "r", label: "角色", children: user.role},
          {
            key: "created",
            label: "注册时间",
            children: user.createdAt ?? "-",
          },
        ]}
      />
    </Card>
  );
}
