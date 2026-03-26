import {FloatButton} from "antd";
import {VerticalAlignTopOutlined} from "@ant-design/icons";
import {useThemeStore} from "../../stores/themeStore";
import {THEMES} from "../../styles/themes";

export default function BackToTop() {
  const {theme} = useThemeStore();
  const themeConfig = THEMES[theme];
  const primaryColor = themeConfig.antdConfig.token?.colorPrimary as string;

  return (
    <FloatButton.BackTop
      visibilityHeight={200}
      icon={<VerticalAlignTopOutlined/>}
      style={{backgroundColor: primaryColor}}
      tooltip="返回顶部"
    />
  );
}
