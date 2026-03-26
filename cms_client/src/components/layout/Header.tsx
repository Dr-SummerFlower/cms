import {HomeOutlined} from "@ant-design/icons";
import {App as AntdApp, Avatar, Button, Dropdown, Layout, type MenuProps, Space,} from "antd";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useAuthStore} from "../../stores/authStore";
import {type ThemeName, useThemeStore} from "../../stores/themeStore";
import {ALL_THEME_NAMES, THEMES} from "../../styles/themes";
import {getImageUrl} from "../../utils/image";

const {Header} = Layout;

/** 色块组件，用于下拉选项中展示各主题颜色 */
function Swatch({color, size = 14}: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 3,
        backgroundColor: color,
        border: "1px solid rgba(0,0,0,0.15)",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  );
}

/** 调色盘图标，颜色跟随当前主题色 */
function PaletteIcon({color, size = 16}: { color: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    >
      <path
        d="M515.100444 911.758222c-161.393778 0-260.494222-23.495111-302.990222-71.793778-22.442667-25.486222-21.333333-49.521778-20.48-56.291555 0.455111-6.030222 15.530667-189.923556 28.216889-275.655111-4.608-3.128889-14.392889-7.054222-20.053333-9.329778a229.831111 229.831111 0 0 1-13.880889-5.888c-18.716444-8.789333-57.571556-28.046222-57.571556-28.046222-48.298667-22.186667-76.942222-50.403556-83.996444-83.399111-5.660444-26.424889 3.982222-49.180444 14.876444-61.696 1.308444-1.479111 2.702222-2.872889 4.181334-4.124445l227.072-193.735111a39.907556 39.907556 0 0 1 63.800889 17.607111c24.888889 73.699556 97.024 84.736 137.841777 84.736 10.865778 0 17.777778-0.853333 17.834667-0.881778 3.441778-0.426667 7.111111-0.426667 10.552889 0.028445 0 0 6.769778 0.824889 17.265778 0.824889 40.021333 0 110.791111-10.979556 135.253333-84.565334a39.964444 39.964444 0 0 1 64.085333-17.607111l223.800889 193.735111c1.479111 1.28 2.872889 2.673778 4.124445 4.152889 10.780444 12.515556 20.280889 35.299556 14.592 61.639111-7.054222 32.824889-35.299556 60.984889-83.939556 83.626667 0 0.028444-37.489778 18.887111-55.694222 27.562667-4.096 1.934222-8.760889 3.868444-13.710222 5.888-5.518222 2.247111-15.104 6.144-19.598223 9.244444 12.572444 86.471111 27.392 269.880889 28.017778 277.703111 0.682667 5.006222 1.735111 29.184-20.878222 54.812445-42.325333 48.099556-140.032 71.452444-298.723556 71.452444z m-243.541333-125.354666c6.712889 7.936 48.952889 45.425778 243.541333 45.425777 192.227556 0 233.187556-37.575111 239.530667-45.312-2.986667-35.925333-16.384-195.242667-27.249778-268.686222-9.102222-61.582222 47.530667-84.593778 68.835556-93.240889 3.413333-1.393778 6.656-2.673778 9.472-4.010666 17.92-8.533333 55.096889-27.249778 55.153778-27.278223 24.462222-11.434667 34.474667-20.565333 38.4-25.287111l-175.36-151.779555c-52.792889 78.193778-144.355556 87.808-186.083556 87.808-9.927111 0-17.834667-0.540444-22.698667-0.967111a255.601778 255.601778 0 0 1-22.983111 0.967111c-42.325333 0-135.253333-9.671111-188.643555-88.291556l-178.488889 152.291556c4.067556 4.750222 14.108444 13.710222 37.831111 24.604444 1.137778 0.540444 38.855111 19.285333 57.059556 27.818667 2.872889 1.336889 6.172444 2.645333 9.642666 4.039111 21.589333 8.647111 78.904889 31.601778 69.660445 93.411555-11.178667 74.24-24.945778 236.344889-27.619556 268.487112z"
        fill={color}
        p-id="6658"
      ></path>
    </svg>
  );
}

export default function AppHeader(): JSX.Element {
  const {isAuthed, user, logout} = useAuthStore();
  const {theme, setTheme} = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const {message} = AntdApp.useApp();

  const themeConfig = THEMES[theme];
  const isMobile = window.innerWidth <= 768;

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: isMobile ? "0 12px" : "0 24px",
    background: themeConfig.headerGradient,
    borderBottom: themeConfig.headerBorder,
    height: "72px",
    boxShadow: themeConfig.headerShadow,
    position: "relative",
    zIndex: 1000,
  };

  /* ---- 主题下拉菜单 ---- */
  const themeMenuItems: MenuProps["items"] = ALL_THEME_NAMES.map((name) => ({
    key: name,
    label: (
      <Space size={8}>
        <Swatch color={THEMES[name].swatch}/>
        <span>{name}</span>
      </Space>
    ),
  }));

  const handleThemeMenuClick = ({key}: { key: string }) => {
    setTheme(key as ThemeName);
  };

  /* ---- 用户菜单 ---- */
  const getUserMenuItems = (): MenuProps["items"] => [
    ...(user?.role !== "INSPECTOR"
      ? [{key: "tickets", label: "我的票务"}]
      : []),
    {key: "profile", label: "个人资料"},
    ...(user?.role === "ADMIN" ? [{key: "admin", label: "管理后台"}] : []),
    ...(user?.role === "INSPECTOR"
      ? [{key: "inspector", label: "验票入口"}]
      : []),
    {type: "divider" as const},
    {key: "logout", label: "退出登录"},
  ];

  const handleUserMenuClick = ({key}: { key: string }) => {
    switch (key) {
      case "tickets":
        navigate("/me/tickets");
        break;
      case "profile":
        navigate("/me/profile");
        break;
      case "admin":
        navigate("/admin");
        break;
      case "inspector":
        navigate("/inspector");
        break;
      case "logout":
        logout();
        message.success("已退出");
        navigate("/");
        break;
    }
  };

  const getRouteTitle = (path: string) => {
    if (path === "/") return "主页";
    if (path.startsWith("/login")) return "登录";
    if (path.startsWith("/register")) return "注册";
    if (path.startsWith("/me/tickets")) return "我的票务";
    if (path.startsWith("/me/profile")) return "个人资料";
    if (path.startsWith("/admin")) return "管理后台";
    if (path.startsWith("/inspector")) return "验票入口";
    return "演唱会管理";
  };

  return (
    <Header style={headerStyle}>
      {/* Logo 区域 */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          minWidth: 0,
          flexShrink: 0,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <div
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: isMobile ? "20px" : "24px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 2px 4px rgba(0,0,0,0.25)",
            letterSpacing: "0.5px",
          }}
        >
          演唱会管理
        </div>
      </Link>

      {/* 非首页时显示返回主页按钮 */}
      {location.pathname !== "/" && (
        <div style={{marginLeft: "8px"}}>
          {isMobile ? (
            <Button
              type="text"
              icon={<HomeOutlined/>}
              onClick={() => navigate("/")}
              style={{color: "#fff"}}
            />
          ) : (
            <Button
              type="link"
              icon={<HomeOutlined/>}
              onClick={() => navigate("/")}
              style={{color: "#fff", fontWeight: 600}}
            >
              返回主页
            </Button>
          )}
        </div>
      )}

      {/* 中间：当前页面标题（PC 端显示） */}
      <div
        style={{
          flex: 1,
          minWidth: "16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "16px",
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            display: isMobile ? "none" : "block",
          }}
        >
          {getRouteTitle(location.pathname)}
        </div>
      </div>

      {/* 右侧操作区 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "6px" : "10px",
          flexShrink: 0,
        }}
      >
        {/* 主题选择器 */}
        <Dropdown
          menu={{
            items: themeMenuItems,
            onClick: handleThemeMenuClick,
            selectedKeys: [theme],
          }}
          placement="bottomRight"
        >
          <Button
            size={isMobile ? "small" : "middle"}
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "#fff",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
              paddingInline: isMobile ? 8 : 12,
            }}
          >
            <PaletteIcon color={themeConfig.swatch} size={16}/>
            {!isMobile && <span style={{fontSize: 13}}>主题切换</span>}
          </Button>
        </Dropdown>

        {/* 用户区域 */}
        {isAuthed ? (
          <Dropdown
            menu={{
              items: getUserMenuItems(),
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            overlayStyle={{minWidth: "160px"}}
          >
            <Avatar
              style={{
                cursor: "pointer",
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }}
              src={getImageUrl(user?.avatar)}
              alt={user?.username}
              size={isMobile ? "default" : "large"}
            >
              {user?.username?.at?.(0) ?? "我"}
            </Avatar>
          </Dropdown>
        ) : (
          <Button
            size={isMobile ? "middle" : "large"}
            onClick={() => navigate("/login")}
            style={{
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: 500,
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.35)",
              backgroundColor: "transparent",
              color: "#fff",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            登录
          </Button>
        )}
      </div>
    </Header>
  );
}
