export function getImageUrl(
  url: string | undefined | null,
): string | undefined {
  // 处理空值
  if (!url) {
    return undefined;
  }

  // 如果已经是代理路径，直接返回
  if (url.startsWith("/api/proxy")) {
    return url;
  }

  // 处理完整URL (http/https)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const urlObj = new URL(url);
      // 获取完整路径包括查询参数，移除开头的斜杠
      const path = urlObj.pathname + urlObj.search;
      const cleanPath = path.startsWith("/") ? path.substring(1) : path;

      // 防止空路径
      return cleanPath ? `/api/proxy/${cleanPath}` : undefined;
    } catch {
      // URL解析失败的回退方案
      try {
        // 更健壮的正则：匹配协议后的内容，包括可能没有路径的情况
        const match = url.match(/https?:\/\/[^/]+(\/[^?]*)?(\?.*)?$/);
        if (match) {
          // 提取路径部分，处理可能为空的情况
          const fullPath = (match[1] || "") + (match[2] || "");
          const cleanPath = fullPath.startsWith("/")
            ? fullPath.substring(1)
            : fullPath;

          return cleanPath ? `/api/proxy/${cleanPath}` : undefined;
        }
      } catch {
        // 二次失败，尝试简单处理
        const pathPart = url.split(/https?:\/\//)[1]?.split(/\/(.+)/)[1];
        return pathPart ? `/api/proxy/${pathPart}` : undefined;
      }
      return undefined;
    }
  }

  // 统一处理相对路径和绝对路径
  // 确保只保留一个斜杠连接
  const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
  return cleanUrl ? `/api/proxy/${cleanUrl}` : undefined;
}
