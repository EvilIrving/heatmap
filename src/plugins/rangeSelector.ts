import type { Plugin } from 'chart.js';

export interface RangeSelectorOptions {
  start?: number;
  end?: number;

  handleWidth?: number;
  handleHeight?: number;

  selectedColor?: string;
  unselectedColor?: string;

  onChange?: (start: number, end: number) => void;
}

interface State {
  start: number;
  end: number;

  dragging: null | 'left' | 'right';

  leftX: number;
  rightX: number;
}

declare module 'chart.js' {
  interface Chart {
    $rangeState?: State;
  }
}

export const rangeSelectorPlugin: Plugin<'bar', RangeSelectorOptions> = {
  id: 'rangeSelector',

  defaults: {
    start: 0,
    end: 100,
    handleWidth: 10,
    handleHeight: 20,
    selectedColor: '#3b82f6',
    unselectedColor: '#cbd5e1',
  },

  afterInit(chart, _args, opts) {
    chart.$rangeState = {
      start: opts.start ?? 0,
      end: opts.end ?? 100,
      dragging: null,
      leftX: 0,
      rightX: 0,
    };
  },

  beforeDraw(chart, _args, opts) {
    const state = chart.$rangeState;
    if (!state) return;

    // Reset if values are invalid
    if (!isFinite(state.start)) state.start = opts.start ?? 0;
    if (!isFinite(state.end)) state.end = opts.end ?? 100;

    const { ctx, chartArea } = chart;

    if (!chartArea) return;

    // Calculate pixel positions based on percentage (continuous)
    const rangeWidth = chartArea.right - chartArea.left;
    const startX = chartArea.left + (state.start / 100) * rangeWidth;
    const endX = chartArea.left + (state.end / 100) * rangeWidth;

    state.leftX = startX;
    state.rightX = endX;

    const top = chartArea.top;
    const bottom = chartArea.bottom;

    ctx.save();

    ctx.fillStyle = 'rgba(59,130,246,0.1)';
    ctx.fillRect(startX, top, endX - startX, bottom - top);

    ctx.restore();
  },

  afterDraw(chart, _args, opts) {
    const state = chart.$rangeState;
    if (!state) return;

    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const top = chartArea.top;
    const bottom = chartArea.bottom;
    const centerY = (top + bottom) / 2;

    drawHandle(
      ctx,
      state.leftX,
      centerY - opts.handleHeight! / 2,
      opts.handleWidth!,
      opts.handleHeight!
    );

    drawHandle(
      ctx,
      state.rightX,
      centerY - opts.handleHeight! / 2,
      opts.handleWidth!,
      opts.handleHeight!
    );
  },

  beforeDatasetsDraw(chart, _args, opts) {
    const state = chart.$rangeState;
    if (!state) return;

    const meta = chart.getDatasetMeta(0);
    if (meta.data.length === 0) return;

    // 高亮判断：柱子与选择区域有接触即算选中
    meta.data.forEach((bar) => {
      const b = bar as any;
      // 获取柱子的左右边缘（考虑宽度）
      const barWidth = b.width || 0;
      const barLeft = b.x - barWidth / 2;
      const barRight = b.x + barWidth / 2;

      // 判断柱子与选择区域是否相交（接触边缘即算选中）
      const inRange = barRight >= state.leftX && barLeft <= state.rightX;
      b.options.backgroundColor = inRange
        ? opts.selectedColor
        : opts.unselectedColor;
    });
  },

  afterEvent(chart, args, opts) {
    const state = chart.$rangeState;
    if (!state) return;

    const e = args.event;

    if (e.x == null || e.y == null) return;

    const { chartArea } = chart;

    if (!chartArea) return;

    // Ensure coordinates are valid
    if (!isFinite(state.leftX) || !isFinite(state.rightX)) return;

    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const handleY = centerY - opts.handleHeight! / 2;
    const hw = opts.handleWidth!;
    const hh = opts.handleHeight!;

    const overLeft =
      Math.abs(e.x - state.leftX) < hw &&
      e.y >= handleY &&
      e.y <= handleY + hh;

    const overRight =
      Math.abs(e.x - state.rightX) < hw &&
      e.y >= handleY &&
      e.y <= handleY + hh;

    if (e.type === 'mousedown') {
      if (overLeft) state.dragging = 'left';
      else if (overRight) state.dragging = 'right';
    }

    if (e.type === 'mouseup' || e.type === 'mouseout') {
      state.dragging = null;
    }

    if (e.type === 'mousemove' && state.dragging) {
      const { chartArea } = chart;
      if (!chartArea) return;

      const rangeWidth = chartArea.right - chartArea.left;
      if (rangeWidth <= 0) return;

      // 连续平滑移动：将鼠标X坐标直接转换为百分比
      const percent = ((e.x - chartArea.left) / rangeWidth) * 100;

      if (!isFinite(percent)) return;

      if (state.dragging === 'left') {
        state.start = clamp(percent, 0, state.end - 1);
      }

      if (state.dragging === 'right') {
        state.end = clamp(percent, state.start + 1, 100);
      }

      opts.onChange?.(state.start, state.end);

      // 标记需要重新渲染
      args.changed = true;
    }

    if (overLeft || overRight || state.dragging) {
      chart.canvas.style.cursor = 'ew-resize';
    } else {
      chart.canvas.style.cursor = 'default';
    }
  },
};

function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();

  ctx.fillStyle = '#3b82f6';

  ctx.beginPath();
  ctx.roundRect(x - w / 2, y, w, h, 3);
  ctx.fill();

  ctx.strokeStyle = '#fff';

  ctx.beginPath();

  ctx.moveTo(x - 2, y + 5);
  ctx.lineTo(x - 2, y + h - 5);

  ctx.moveTo(x + 2, y + 5);
  ctx.lineTo(x + 2, y + h - 5);

  ctx.stroke();

  ctx.restore();
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

 