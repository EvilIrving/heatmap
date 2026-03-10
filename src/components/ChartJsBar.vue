<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { rangeSelectorPlugin, type RangeSelectorOptions } from '../plugins/rangeSelector';
import { generateLargeSampleData, getDataStats } from '../data/mockData';
import type { HeatmapData, HeatmapCell } from '../canvas/types';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    rangeSelector?: RangeSelectorOptions;
  }
}

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  rangeSelectorPlugin
);

type TimeRange = 'year' | 'month' | 'day';

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const currentRange = ref<TimeRange>('year');
const rawData = ref<{ label: string; value: number }[]>([]);
const heatmapData = ref<HeatmapData>(generateLargeSampleData());

// 从热力图数据聚合生成图表数据
function generateDataFromHeatmap(range: TimeRange): { label: string; value: number }[] {
  const data: { label: string; value: number }[] = [];
  const cells = heatmapData.value.cells;

  if (range === 'year') {
    // 按年份聚合
    const yearMap = new Map<string, number>();
    for (const row of cells) {
      for (const cell of row) {
        const year = cell.date.split('-')[0];
        yearMap.set(year, (yearMap.get(year) || 0) + cell.count);
      }
    }
    // 排序并转换为数组
    const sortedYears = Array.from(yearMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [year, value] of sortedYears) {
      data.push({ label: year, value });
    }
  } else if (range === 'month') {
    // 按月份聚合
    const monthMap = new Map<string, number>();
    for (const row of cells) {
      for (const cell of row) {
        const [year, month] = cell.date.split('-');
        const key = `${year}-${month}`;
        monthMap.set(key, (monthMap.get(key) || 0) + cell.count);
      }
    }
    // 排序并转换为数组
    const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [month, value] of sortedMonths) {
      data.push({ label: month, value });
    }
  } else {
    // 按天聚合
    const dayMap = new Map<string, number>();
    for (const row of cells) {
      for (const cell of row) {
        dayMap.set(cell.date, (dayMap.get(cell.date) || 0) + cell.count);
      }
    }
    // 排序并转换为数组
    const sortedDays = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [day, value] of sortedDays) {
      data.push({ label: day, value });
    }
  }

  return data;
}

// 生成模拟数据（使用热力图数据）
function generateData(range: TimeRange): { label: string; value: number }[] {
  return generateDataFromHeatmap(range);
}

// 初始化图表
function initChart() {
  if (!chartRef.value) return;

  rawData.value = generateData(currentRange.value);

  const ctx = chartRef.value.getContext('2d');
  if (!ctx) return;

  const rangeSelectorOptions: RangeSelectorOptions = {
    start: 0,
    end: 100,
    selectedColor: '#3b82f6',
    unselectedColor: '#bfdbfe',
    onChange: (start, end) => {
      console.log('Range changed:', start, end);
    },
  };

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rawData.value.map(d => d.label),
      datasets: [
        {
          label: '数据量',
          data: rawData.value.map(d => d.value),
          backgroundColor: rawData.value.map(() => '#3b82f6'),
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      events: ['mousedown', 'mousemove', 'mouseup', 'mouseout'],
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `${rawData.value.length} Data`,
          align: 'start',
          font: {
            size: 16,
            weight: 'bold',
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const item = items[0];
              return String(item.label);
            },
            label: (item) => {
              return `值: ${item.formattedValue}`;
            },
          },
        },
        rangeSelector: rangeSelectorOptions,
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6b7280',
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb',
          },
          ticks: {
            color: '#6b7280',
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
    },
    plugins: [rangeSelectorPlugin],
  });
}

// 切换时间范围
function switchRange(range: TimeRange) {
  currentRange.value = range;
  rawData.value = generateData(range);

  if (chart) {
    chart.data.labels = rawData.value.map(d => d.label);
    chart.data.datasets[0].data = rawData.value.map(d => d.value);
    chart.data.datasets[0].backgroundColor = rawData.value.map(() => '#3b82f6');

    // Update title
    if (chart.options.plugins?.title) {
      chart.options.plugins.title.text = `${rawData.value.length} Data`;
    }

    // Reset range to full
    if (chart.$rangeState) {
      chart.$rangeState.start = 0;
      chart.$rangeState.end = 100;
    }
    chart.update();
  }
}

// 重置
function reset() {
  if (chart) {
    if (chart.$rangeState) {
      chart.$rangeState.start = 0;
      chart.$rangeState.end = 100;
    }
    chart.update();
  }
}

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-700">数据统计</h2>
      <div class="flex items-center gap-4">
        <!-- 时间范围切换 -->
        <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            v-for="range in ['year', 'month', 'day'] as TimeRange[]"
            :key="range"
            @click="switchRange(range)"
            class="px-3 py-1 text-sm rounded-md transition-colors"
            :class="
              currentRange === range
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            "
          >
            {{ range === 'year' ? '年' : range === 'month' ? '月' : '日' }}
          </button>
        </div>
        <!-- 重置按钮 -->
        <button
          @click="reset"
          class="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          重置
        </button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="relative w-full h-80">
      <canvas ref="chartRef"></canvas>
    </div>

    <!-- 说明文字 -->
    <div class="mt-4 text-sm text-gray-500">
      <p>拖动底部手柄调整选区范围，选区内柱状图高亮显示</p>
    </div>
  </div>
</template>
