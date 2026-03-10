/**
 * Canvas 热力图类型定义
 */

// ========== CanvasEngine Types ==========

export interface CanvasEngineOptions {
  dpr?: number;                    // 设备像素比
  width: number;                   // 逻辑宽度
  height: number;                  // 逻辑高度
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

export interface CanvasMouseEvent {
  x: number;                       // 逻辑 X 坐标
  y: number;                       // 逻辑 Y 坐标
  rawX: number;                    // 原始 X 坐标
  rawY: number;                    // 原始 Y 坐标
}

export interface ClickEvent extends CanvasMouseEvent {
  clickCount: number;              // 点击次数 (1=单击，2=双击)
}

/**
 * 渲染器接口 - 由具体组件实现
 */
export interface Renderer {
  /** 渲染入口 */
  render(ctx: RenderContext): void;

  /** 可选：清理资源 */
  destroy?(): void;
}

/**
 * 事件处理器接口
 */
export interface EventHandler {
  /** 处理点击事件 */
  onClick?(event: ClickEvent): void;

  /** 处理鼠标移动 */
  onMouseMove?(event: CanvasMouseEvent): void;

  /** 处理鼠标离开 */
  onMouseLeave?(): void;
}

// ========== HeatmapRenderer Types ==========

export interface HeatmapCell {
  date: string;  // 日期字符串，如 "2024-03-08"
  hour: number;  // 0-23
  count: number;
}

export interface HeatmapData {
  cells: HeatmapCell[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
  maxCount: number;
}

export interface ActivityLevel {
  name: string;
  color: string;
  min: number;
  max: number;
}

/** 单元格选择信息（带原始数据） */
export interface CellSelection {
  day: number;
  hour: number;
  type: 'cell' | 'row' | 'col';
  /** 原始单元格数据（仅当 type='cell' 时存在） */
  data?: HeatmapCell;
}

export interface HeatmapRendererOptions {
  data: HeatmapData;
  activityLevels: ActivityLevel[];
  selectedCells: CellSelection[];
  showFilter?: boolean;
}

// ========== HeatmapEventHandler Types ==========

export interface HeatmapEventHandlers {
  onCellSelect?: (event: CellSelectEvent) => void;
  onSettingsOpen?: () => void;
}



export interface CellSelectEvent {
  /** 当前点击的单元格（带原始数据） */
  cell: CellSelection;
  ctrlKey: boolean;
  /** 所有选中的单元格（带原始数据） */
  selectedCells: CellSelection[];
}

export interface HeatmapEventHandlerOptions {
  handlers: HeatmapEventHandlers;
  getMultiSelectKey: () => boolean;
  getSelectedCells: () => CellSelection[];
  cellCount?: number;  // 列数 (小时数)
  rowCount?: number;   // 行数 (天数)
}