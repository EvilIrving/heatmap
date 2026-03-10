<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import ActivityHeatmap from './components/ActivityHeatmap.vue';
import ChartJsBar from './components/ChartJsBar.vue';
import { createActivityLevels, type HeatmapData, type ActivityLevel, type CellSelection, type HeatmapCell } from './canvas';

type TabType = 'heatmap' | 'echarts';
const activeTab = ref<TabType>('echarts');

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 生成模拟数据（使用真实日期）
 * @param startDate 起始日期，默认为当前日期往前推6天（本周）
 */
function generateSampleData(startDate?: Date): HeatmapData {
  const baseDate = startDate ?? new Date();
  // 调整到本周一
  const dayOfWeek = baseDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + mondayOffset);

  const cells: HeatmapCell[][] = [];
  const rowTotals: number[] = [];
  const colTotals: number[] = new Array(24).fill(0);
  let grandTotal = 0;
  let maxCount = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + dayIndex);
    const dateStr = formatDate(currentDate);

    const row: HeatmapCell[] = [];
    let rowTotal = 0;

    for (let hour = 0; hour < 24; hour++) {
      // 生成带有模式的随机数据
      let baseCount = Math.random() * 8000 + 500;

      // 工作时间（9-18点）活动更高
      if (hour >= 9 && hour <= 18) {
        baseCount *= 1.5;
      }

      // 夜间（0-6点）活动较低
      if (hour >= 0 && hour <= 6) {
        baseCount *= 0.3;
      }

      // 周末模式
      if (dayIndex >= 5) {
        baseCount *= 0.7;
      }

      const count = Math.round(baseCount);
      row.push({ date: dateStr, hour, count });
      rowTotal += count;
      colTotals[hour] += count;
      grandTotal += count;
      maxCount = Math.max(maxCount, count);
    }

    cells.push(row);
    rowTotals.push(rowTotal);
  }

  return {
    cells,
    rowTotals,
    colTotals,
    grandTotal,
    maxCount
  };
}

// ========== 数据设计 ==========
// 原始数据：生成后不变，使用 shallowRef（仅监听引用变化，不深度监听内部）
// 筛选/交互状态：使用 ref，响应式
const data = shallowRef<HeatmapData>(generateSampleData());

// UI 状态（响应式）
const activityLevels = ref<ActivityLevel[]>(createActivityLevels(data.value.maxCount, 4));
const selectedCells = ref<CellSelection[]>([]);
const showFilter = ref(true);

function handleCellSelect(event: { cell: CellSelection; ctrlKey: boolean; selectedCells: CellSelection[] }) {
  console.log('Cell selected:', event);
  selectedCells.value = event.selectedCells;
}

function handleActivityLevelsChange(event: { levels: ActivityLevel[] }) {
  console.log('Activity levels changed:', event.levels);
  activityLevels.value = event.levels;
}

function regenerateData() {
  // 整体替换原始数据（shallowRef 会触发更新）
  data.value = generateSampleData();
  activityLevels.value = createActivityLevels(data.value.maxCount, 4);
  selectedCells.value = [];
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-full">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Activity Heatmap</h1>
      <p class="text-gray-600 mb-8">Vue 3 + UnoCSS + Canvas 实现的热力图组件</p>

      <!-- Tab 切换 -->
      <div class="flex items-center gap-2 mb-6">
        <button
          @click="activeTab = 'heatmap'"
          class="px-6 py-2.5 text-sm font-medium rounded-lg transition-all"
          :class="
            activeTab === 'heatmap'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          "
        >
          热力图
        </button>
        <button
          @click="activeTab = 'echarts'"
          class="px-6 py-2.5 text-sm font-medium rounded-lg transition-all"
          :class="
            activeTab === 'echarts'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          "
        >
          柱状图
        </button>
      </div>

      <!-- 热力图 Tab -->
      <template v-if="activeTab === 'heatmap'">
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-700">热力图演示</h2>
            <div class="flex gap-3">
              <button
                @click="regenerateData"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                重新生成数据
              </button>
              <button
                @click="selectedCells = []"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                清除选择
              </button>
            </div>
          </div>

          <ActivityHeatmap
            :data="data"
            :activity-levels="activityLevels"
            :selected-cells="selectedCells"
            :show-filter="showFilter"
            @cellselect="handleCellSelect"
            @activitylevelschange="handleActivityLevelsChange"
          />
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">使用说明</h2>
          <ul class="list-disc list-inside space-y-2 text-gray-600">
            <li>单击单元格：选中/取消选中该单元格</li>
            <li>单击行/列总计：选中整行/整列</li>
            <li>Ctrl + 单击：多选模式</li>
            <li>点击图例旁的 ⚙ 图标：打开活动水平设置</li>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">选中状态</h2>
          <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(selectedCells, null, 2) }}</pre>
        </div>
      </template>

      <!-- 柱状图 Tab -->
      <template v-if="activeTab === 'echarts'">
        <ChartJsBar />
      </template>
    </div>
  </div>
</template>
