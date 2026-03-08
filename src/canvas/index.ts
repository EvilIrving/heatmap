/**
 * Canvas 模块导出
 */

// 导出工具函数
export { roundRect, drawText, formatNumber, getContrastTextColor, getDayFromDate, createActivityLevels } from './utils';
export type { TextOptions } from './utils';

// 导出类型
export type {
  CanvasEngineOptions,
  RenderContext,
  Renderer,
  EventHandler,
  CanvasMouseEvent,
  ClickEvent,
  // HeatmapRenderer 类型
  HeatmapCell,
  HeatmapData,
  ActivityLevel,
  CellSelection,
  HeatmapRendererOptions,
  // HeatmapEventHandler 类型
  HeatmapEventHandlers,
  CellSelectEvent,
  HeatmapEventHandlerOptions
} from './types';

// 导出常量
export { LAYOUT, DEFAULT_LEVEL_COLORS, DEFAULT_LEVEL_NAMES, DEFAULT_LEVEL_PERCENTAGES, DAY_LABELS, COLORS, FONTS } from './const';

// 导出类
export { CanvasEngine } from './CanvasEngine';
export { HeatmapRenderer } from './HeatmapRenderer';
export { HeatmapEventHandler } from './HeatmapEventHandler';
