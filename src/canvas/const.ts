/**
 * Canvas 热力图常量配置
 */

// ========== 布局常量 ==========

export const LAYOUT = {
  CELL_WIDTH: 40,
  CELL_HEIGHT: 26,
  ROW_LABEL_WIDTH: 40,
  COL_LABEL_HEIGHT: 20,
  LEGEND_WIDTH: 260,
  PADDING: 20,
  GAP: 2
} as const;

// ========== 活动等级配置 ==========

/** 默认活动等级配色方案 */
export const DEFAULT_LEVEL_COLORS = {
  3: ['#b7eb8f', '#ffbb96', '#ff7875'],
  4: ['#b7eb8f', '#fff566', '#ffbb96', '#ff7875'],
  5: ['#b7eb8f', '#fff566', '#ffbb96', '#ff7875', '#cf1322']
} as const;

/** 默认活动等级名称 */
export const DEFAULT_LEVEL_NAMES = {
  3: ['低活跃', '中等活跃', '高活跃'],
  4: ['低活跃', '中等活跃', '高活跃', '极度活跃'],
  5: ['极低活跃', '低活跃', '中等活跃', '高活跃', '极度活跃']
} as const;

/** 默认百分比分割点 */
export const DEFAULT_LEVEL_PERCENTAGES = {
  3: [0.33, 0.67, 1],
  4: [0.25, 0.5, 0.75, 1],
  5: [0.2, 0.4, 0.6, 0.8, 1]
} as const;

// ========== 星期标签 ==========

export const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

// ========== 样式常量 ==========

export const COLORS = {
  EMPTY_CELL: '#f5f5f5',
  SELECTED_BORDER: '#1890ff',
  TEXT_LIGHT: '#999',
  TEXT_DARK: '#333',
  TEXT_WHITE: '#fff',
  LABEL_COLOR: '#666'
} as const;

export const FONTS = {
  DEFAULT: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  BOLD: 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  TITLE: 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
} as const;
