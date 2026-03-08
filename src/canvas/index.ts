/**
 * Canvas 模块导出
 */

export { CanvasEngine, roundRect, drawText } from './CanvasEngine';
export type {
  CanvasEngineOptions,
  RenderContext,
  Renderer,
  EventHandler,
  MouseEvent,
  ClickEvent
} from './CanvasEngine';

export {
  HeatmapRenderer,
  LAYOUT,
  createActivityLevels,
  getDayFromDate,
  DEFAULT_LEVEL_COLORS,
  DEFAULT_LEVEL_NAMES
} from './HeatmapRenderer';
export type {
  HeatmapCell,
  HeatmapData,
  ActivityLevel,
  CellSelection,
  HeatmapRendererOptions
} from './HeatmapRenderer';

// 从 const.ts 导出常量
export {
  DEFAULT_LEVEL_PERCENTAGES,
  DAY_LABELS,
  COLORS,
  FONTS
} from './const';

export { HeatmapEventHandler } from './HeatmapEventHandler';
export type {
  HeatmapEventHandlers,
  CellSelectEvent,
  CellSelectionWithData,
  HeatmapEventHandlerOptions
} from './HeatmapEventHandler';
