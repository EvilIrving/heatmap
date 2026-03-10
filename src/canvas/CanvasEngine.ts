/**
 * Canvas 引擎 - 提供渲染和事件处理的核心抽象
 *
 * 架构设计:
 * 1. CanvasEngine - 核心引擎类，管理 canvas 上下文、渲染循环、事件绑定
 * 2. Renderer - 渲染器接口，由具体组件实现绘制逻辑
 * 3. EventHandler - 事件处理器，将鼠标坐标转换为逻辑坐标并触发事件
 */

import type { Renderer, EventHandler, CanvasEngineOptions, RenderContext, CanvasMouseEvent } from './types';

// ========== Canvas Engine ==========

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<CanvasEngineOptions>;
  private renderer: Renderer | null = null;
  private eventHandler: EventHandler | null = null;

  constructor(canvas: HTMLCanvasElement, options: CanvasEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.options = {
      dpr: options.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ?? 1,
      width: options.width,
      height: options.height
    };

    this.setupCanvas();
    this.bindEvents();
  }

  private setupCanvas(): void {
    const { width, height, dpr } = this.options;

    // 设置实际像素
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    // 设置 CSS 尺寸
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // 缩放上下文
    this.ctx.scale(dpr, dpr);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  private handleContextMenu(e: globalThis.MouseEvent): void {
    e.preventDefault();
  }

  private getLogicalCoords(e: globalThis.MouseEvent): CanvasMouseEvent {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rawX: e.clientX,
      rawY: e.clientY
    };
  }

  private handleClick(e: globalThis.MouseEvent): void {
    if (!this.eventHandler?.onClick) return;

    const pos = this.getLogicalCoords(e);
    this.eventHandler.onClick({ ...pos, clickCount: 1 });
  }

  private handleMouseMove(e: globalThis.MouseEvent): void {
    const pos = this.getLogicalCoords(e);
    this.eventHandler?.onMouseMove?.(pos);
  }

  // ========== Public API ==========

  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
    this.render();
  }

  setEventHandler(handler: EventHandler): void {
    this.eventHandler = handler;
  }

  render(): void {
    if (!this.renderer) return;

    const renderCtx: RenderContext = {
      ctx: this.ctx,
      width: this.options.width,
      height: this.options.height,
      dpr: this.options.dpr
    };

    // 清空画布
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);

    this.renderer.render(renderCtx);
  }

  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.setupCanvas();
    this.render();
  }

  destroy(): void {
    this.renderer?.destroy?.();
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  // ========== Helpers ==========

  /** 获取 Canvas 元素 */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /** 获取渲染上下文 */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /** 获取尺寸 */
  getSize(): { width: number; height: number } {
    return { width: this.options.width, height: this.options.height };
  }
}
