/**
 * Canvas 工具函数
 */

/**
 * 绘制圆角矩形
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/**
 * 绘制文字
 */
export interface TextOptions {
  align?: CanvasTextAlign;
  color?: string;
  font?: string;
  baseline?: CanvasTextBaseline;
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: TextOptions
): void {
  const {
    align = 'center',
    color = '#333',
    font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    baseline = 'middle'
  } = options || {};
  
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * 格式化数字（大数字使用 k/m/b 缩写）
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'b';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * 根据颜色亮度计算合适的文字颜色
 * 使用相对亮度公式：L = 0.299*R + 0.587*G + 0.114*B
 */
export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? '#333' : '#fff';
}

/**
 * 从日期字符串获取星期几（0=周一，6=周日）
 */
export function getDayFromDate(dateStr: string): number {
  const date = new Date(dateStr);
  const day = date.getDay();
  // JavaScript: 0=周日，1=周一，..., 6=周六
  // 转换为：0=周一，1=周二，..., 6=周日
  return day === 0 ? 6 : day - 1;
}

/**
 * 创建活动等级配置
 * @param maxCount 最大计数值
 * @param levelCount 等级数量（3-5）
 * @param options 自定义选项
 */
export function createActivityLevels(
  maxCount: number,
  levelCount: 3 | 4 | 5 = 4,
  options?: {
    colors?: string[];
    names?: string[];
    percentages?: number[];
  }
): import('./types').ActivityLevel[] {
  const colors = options?.colors ?? ['#b7eb8f', '#fff566', '#ffbb96', '#ff7875'];
  const names = options?.names ?? ['低活跃', '中等活跃', '高活跃', '极度活跃'];
  const percentages = options?.percentages ?? [0.25, 0.5, 0.75, 1];

  const levels: import('./types').ActivityLevel[] = [];
  let prevMax = 0;

  for (let i = 0; i < levelCount; i++) {
    const max = i === levelCount - 1 ? maxCount : Math.round(maxCount * percentages[i]);
    levels.push({
      name: names[i],
      color: colors[i],
      min: prevMax + (i === 0 ? 0 : 1),
      max
    });
    prevMax = max;
  }

  return levels;
}