<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  CanvasEngine,
  HeatmapRenderer,
  HeatmapEventHandler,
  LAYOUT,
  type HeatmapData,
  type ActivityLevel,
  type CellSelection,
  type CellSelectionWithData
} from '../canvas';

// ========== Props ==========
interface Props {
  data: HeatmapData;
  activityLevels?: ActivityLevel[];
  selectedCells?: CellSelection[];
  showFilter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  activityLevels: () => [],
  selectedCells: () => [],
  showFilter: false
});

// ========== Emits ==========
const emit = defineEmits<{
  cellselect: [event: { cell: CellSelectionWithData; ctrlKey: boolean; selectedCells: CellSelectionWithData[] }];
  activitylevelschange: [event: { levels: ActivityLevel[] }];
}>();

// ========== State ==========
const canvasRef = ref<HTMLCanvasElement | null>(null);
const settingsOpen = ref(false);
const ctrlKey = ref(false);
const localActivityLevels = ref<ActivityLevel[]>(props.activityLevels.length > 0 ? [...props.activityLevels] : []);

// Canvas 引擎实例
let engine: CanvasEngine | null = null;
let renderer: HeatmapRenderer | null = null;
let eventHandler: HeatmapEventHandler | null = null;

// 计算画布尺寸
const canvasWidth = computed(() => {
  const { ROW_LABEL_WIDTH, CELL_WIDTH, GAP, PADDING, LEGEND_WIDTH } = LAYOUT;
  return ROW_LABEL_WIDTH + (props.data.cells[0]?.length ?? 0) * (CELL_WIDTH + GAP) + PADDING * 2 + LEGEND_WIDTH;
});

const canvasHeight = computed(() => {
  const { COL_LABEL_HEIGHT, CELL_HEIGHT, GAP, PADDING } = LAYOUT;
  return COL_LABEL_HEIGHT + props.data.cells.length * (CELL_HEIGHT + GAP) + PADDING * 2 + 40;
});

// ========== Lifecycle ==========
onMounted(() => {
  if (!canvasRef.value) return;

  // 创建引擎
  engine = new CanvasEngine(canvasRef.value, {
    width: canvasWidth.value,
    height: canvasHeight.value
  });

  // 创建渲染器
  renderer = new HeatmapRenderer({
    data: props.data,
    activityLevels: localActivityLevels.value,
    selectedCells: props.selectedCells,
    showFilter: props.showFilter
  });

  // 创建事件处理器
  eventHandler = new HeatmapEventHandler({
    handlers: {
      onCellSelect: handleCellSelect,
      onSettingsOpen: () => { settingsOpen.value = true; }
    },
    getCtrlKey: () => ctrlKey.value,
    getSelectedCells: () => props.selectedCells,
    getData: () => props.data,
    cellCount: 24,
    rowCount: 7
  });

  // 设置 renderer 引用到 eventHandler（用于检测设置图标点击）
  eventHandler.setRenderer(renderer);

  // 设置引擎
  engine.setRenderer(renderer);
  engine.setEventHandler(eventHandler);

  // 键盘事件
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);
  
  // Slider drag events
  window.addEventListener('mousemove', handleSliderMouseMove);
  window.addEventListener('mouseup', handleSliderMouseUp);
});

onUnmounted(() => {
  engine?.destroy();
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', handleBlur);
  window.removeEventListener('mousemove', handleSliderMouseMove);
  window.removeEventListener('mouseup', handleSliderMouseUp);
});

// ========== Watchers ==========
// 原始数据变化（整体替换时触发，无需 deep）
watch(() => props.data, (newData) => {
  if (renderer && engine) {
    renderer.updateOptions({
      data: newData,
      activityLevels: localActivityLevels.value,
      selectedCells: props.selectedCells,
      showFilter: props.showFilter
    });
    engine.render();
  }
});

// UI 状态变化（需要 deep 监听）
watch(() => props.selectedCells, (newCells) => {
  if (renderer && engine) {
    renderer.updateOptions({
      data: props.data,
      activityLevels: localActivityLevels.value,
      selectedCells: newCells,
      showFilter: props.showFilter
    });
    engine.render();
  }
}, { deep: true });

watch(() => props.activityLevels, (newLevels) => {
  if (newLevels.length > 0) {
    localActivityLevels.value = [...newLevels];
    if (renderer && engine) {
      renderer.updateOptions({
        data: props.data,
        activityLevels: newLevels,
        selectedCells: props.selectedCells,
        showFilter: props.showFilter
      });
      engine.render();
    }
  }
}, { deep: true });

// ========== Event Handlers ==========
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Control' || event.key === 'Meta') {
    ctrlKey.value = true;
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === 'Control' || event.key === 'Meta') {
    ctrlKey.value = false;
  }
}

function handleBlur() {
  // 当窗口失去焦点时，重置 ctrlKey 状态
  ctrlKey.value = false;
}

function handleCellSelect(event: {
  cell: CellSelectionWithData;
  ctrlKey: boolean;
  selectedCells: CellSelectionWithData[];
}): void {
  emit('cellselect', event);
}

function handleActivityLevelsChange(): void {
  emit('activitylevelschange', { levels: localActivityLevels.value });
  settingsOpen.value = false;
}

// ========== Slider Functions ==========
function getPercentage(value: number): number {
  return (value / props.data.maxCount) * 100;
}

function getValueFromPercentage(percent: number): number {
  return Math.round((percent / 100) * props.data.maxCount);
}

/** 计算颜色段的样式 */
function getSegmentStyle(index: number) {
  const levels = localActivityLevels.value;
  const left = index === 0 ? 0 : getPercentage(levels[index - 1].max);
  const right = getPercentage(levels[index].max);
  return {
    left: `${left}%`,
    width: `calc(${right - left}% - 0.5px)`,
    background: levels[index].color
  };
}

/** 可拖动的滑块（除最后一个等级外） */
const draggableHandles = computed(() => localActivityLevels.value.slice(0, -1));

// Drag state for sliders
const draggingIndex = ref<number | null>(null);

function handleSliderMouseDown(event: MouseEvent, index: number): void {
  event.preventDefault();
  draggingIndex.value = index;
}

function handleSliderMouseMove(event: MouseEvent): void {
  if (draggingIndex.value === null) return;
  
  const trackEl = document.querySelector('.slider-track-wrapper');
  if (!trackEl) return;
  
  const rect = trackEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const newValue = getValueFromPercentage(percentage);
  
  const levels = [...localActivityLevels.value];
  const index = draggingIndex.value;
  const lastIndex = levels.length - 2; // 最后一个可拖动滑块的索引
  
  // 动态计算边界
  const prevMax = index > 0 ? levels[index - 1].max : 0;
  const nextMax = index < lastIndex ? levels[index + 1].max : props.data.maxCount;
  const clampedValue = Math.max(prevMax + 1, Math.min(nextMax - 1, newValue));
  
  if (clampedValue !== levels[index].max) {
    levels[index].max = clampedValue;
    if (index < levels.length - 1) {
      levels[index + 1].min = clampedValue + 1;
    }
    localActivityLevels.value = levels;
  }
}

function handleSliderMouseUp(): void {
  draggingIndex.value = null;
}

function handleSliderKeyDown(event: KeyboardEvent, index: number): void {
  const levels = [...localActivityLevels.value];
  const step = Math.max(1, Math.round(props.data.maxCount * 0.01)); // 1% step
  let delta = 0;

  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    delta = -step;
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    delta = step;
  } else {
    return;
  }

  event.preventDefault();

  const lastIndex = levels.length - 2;
  const prevMax = index > 0 ? levels[index - 1].max : 0;
  const nextMax = index < lastIndex ? levels[index + 1].max : props.data.maxCount;
  const currentValue = levels[index].max;
  const newValue = Math.max(prevMax + 1, Math.min(nextMax - 1, currentValue + delta));

  if (newValue !== currentValue) {
    levels[index].max = newValue;
    if (index < levels.length - 1) {
      levels[index + 1].min = newValue + 1;
    }
    localActivityLevels.value = levels;
  }
}

// ========== Expose ==========
defineExpose({
  setActivityLevels(levels: ActivityLevel[]) {
    localActivityLevels.value = levels;
  }
});
</script>

<template>
  <div
    class="heatmap-container"
    tabindex="0"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
  >
    <canvas
      ref="canvasRef"
      class="heatmap-canvas"
    />

    <!-- Settings Modal -->
    <div v-if="settingsOpen" class="settings-overlay" @click="settingsOpen = false">
      <div class="settings-modal" @click.stop>
        <div class="settings-header">
          <h3>活动水平设置</h3>
          <button class="close-btn" @click="settingsOpen = false">×</button>
        </div>

        <div class="settings-content">
          <p class="settings-description">拖动滑块来设置事件数量和活动水平之间的对应关系</p>

          <div class="multi-slider-container">
            <!-- Top value range -->
            <div class="top-value-row">
              <span class="top-value-label">({{ data.maxCount.toLocaleString() }})</span>
            </div>

            <!-- Top percentage labels -->
            <div class="percentage-row percentage-row-top">
              <span class="percentage-label percentage-top" style="left: 0%">0%</span>
              <span class="percentage-label percentage-top" style="left: 100%">100%</span>
            </div>

            <!-- Slider track with color segments -->
            <div class="slider-track-wrapper">
              <!-- Color segments (动态渲染) -->
              <div class="slider-track-segments">
                <div
                  v-for="(level, index) in localActivityLevels"
                  :key="`segment-${index}`"
                  class="segment"
                  :style="getSegmentStyle(index)"
                ></div>
              </div>

              <!-- Slider handles (除最后一个等级外) -->
              <div class="slider-handles" role="group" aria-label="Activity level sliders">
                <div
                  v-for="(level, index) in draggableHandles"
                  :key="`handle-${index}`"
                  class="handle"
                  :style="{ left: `${getPercentage(level.max)}%` }"
                  @mousedown="(e) => handleSliderMouseDown(e, index)"
                  @keydown="(e) => handleSliderKeyDown(e, index)"
                  role="slider"
                  tabindex="0"
                  :aria-label="`Activity threshold ${index + 1}`"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-valuenow="Math.round(getPercentage(level.max))"
                >
                  <div class="handle-knob"></div>
                </div>
              </div>
            </div>

            <!-- Bottom percentage labels with value ranges -->
            <div class="percentage-row percentage-row-bottom">
              <div
                v-for="(level, index) in draggableHandles"
                :key="`label-${index}`"
                class="percentage-label-group"
                :style="{ left: `${getPercentage(level.max)}%` }"
              >
                <span class="percentage-label percentage-bottom">{{ Math.round(getPercentage(level.max)) }}%</span>
                <span class="value-range">({{ level.min.toLocaleString() }}-{{ level.max.toLocaleString() }})</span>
              </div>
            </div>

            <!-- Max value description -->
            <div class="max-value-hint">
              <span>100% = 每小时的最大事件数</span>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn-cancel" @click="settingsOpen = false">取消</button>
          <button class="btn-confirm" @click="handleActivityLevelsChange">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  position: relative;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  outline: none;
}

.heatmap-canvas {
  display: block;
  touch-action: none;
  cursor: pointer;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background: #fff;
  border-radius: 8px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.settings-content {
  padding: 20px;
}

.settings-description {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.multi-slider-container {
  position: relative;
  padding: 10px 0 20px 0;
}

.top-value-row {
  text-align: right;
  margin-bottom: 4px;
  padding-right: 20px;
}

.top-value-label {
  font-size: 12px;
  color: #bbb;
}

.slider-track-wrapper {
  position: relative;
  height: 36px;
  margin: 8px 40px 8px 40px;
}

.slider-track-segments {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  transform: translateY(-50%);
  border-radius: 4px;
  overflow: hidden;
  z-index: 10;
  pointer-events: none;
}

.segment {
  position: absolute;
  height: 100%;
}

.slider-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 36px;
  z-index: 20;
  cursor: grab;
}

.slider-handles:active {
  cursor: grabbing;
}

.handle {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.handle-knob {
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  cursor: grab;
}

.handle:hover .handle-knob {
  transform: scale(1.2);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  border-color: #40a9ff;
}

.handle:focus .handle-knob {
  outline: 2px solid #40a9ff;
  outline-offset: 2px;
}

.percentage-row {
  position: relative;
  height: 28px;
}

.percentage-row-top {
  margin-bottom: 4px;
}

.percentage-label { 
  transform: translateX(-50%);
  font-size: 11px;
  color: #bbb;
  white-space: nowrap;
}

.percentage-top {
  top: 0;
}

.percentage-bottom {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.percentage-label-group {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.value-range {
  font-size: 11px;
  color: #bbb;
  white-space: nowrap;
}

.max-value-hint {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.settings-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  color: #333;
}

.btn-cancel:hover {
  border-color: #999;
}

.btn-confirm {
  background: #1890ff;
  border: 1px solid #1890ff;
  color: #fff;
}

.btn-confirm:hover {
  background: #40a9ff;
}
</style>
