import type { HeatmapData, HeatmapCell } from '../canvas/types';

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
 * 生成10年、60个月份、2000个日期的模拟数据
 */
export function generateLargeSampleData(): HeatmapData {
  const cells: HeatmapCell[][] = [];
  const rowTotals: number[] = [];
  const colTotals: number[] = new Array(24).fill(0);
  let grandTotal = 0;
  let maxCount = 0;

  const now = new Date();
  const startYear = now.getFullYear() - 9; // 10年前

  // 生成60个随机月份（从10年中选择）
  const selectedMonths = new Set<string>();
  while (selectedMonths.size < 60) {
    const year = startYear + Math.floor(Math.random() * 10);
    const month = Math.floor(Math.random() * 12) + 1;
    selectedMonths.add(`${year}-${String(month).padStart(2, '0')}`);
  }

  // 从选中的月份中生成2000个随机日期
  const monthList = Array.from(selectedMonths).sort();
  const selectedDates: Date[] = [];

  // 每个选中的月份至少有一些日期
  const baseDatesPerMonth = Math.floor(2000 / 60); // 约33个日期/月
  const remainingDates = 2000 - baseDatesPerMonth * 60; // 剩余的随机分配

  for (const ym of monthList) {
    const [year, month] = ym.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 基础日期数
    const datesForThisMonth = baseDatesPerMonth + (Math.random() < remainingDates / 60 ? 1 : 0);

    for (let i = 0; i < datesForThisMonth && selectedDates.length < 2000; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      selectedDates.push(new Date(year, month - 1, day));
    }
  }

  // 如果还有剩余，随机补充
  while (selectedDates.length < 2000) {
    const ym = monthList[Math.floor(Math.random() * monthList.length)];
    const [year, month] = ym.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    selectedDates.push(new Date(year, month - 1, day));
  }

  // 按日期排序
  selectedDates.sort((a, b) => a.getTime() - b.getTime());

  // 为每个日期生成24小时的数据
  for (const date of selectedDates) {
    const dateStr = formatDate(date);
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
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
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

/**
 * 获取数据统计信息
 */
export function getDataStats(data: HeatmapData) {
  const uniqueDates = new Set<string>();
  const uniqueMonths = new Set<string>();
  const uniqueYears = new Set<number>();

  for (const row of data.cells) {
    for (const cell of row) {
      uniqueDates.add(cell.date);
      const [year, month] = cell.date.split('-');
      uniqueMonths.add(`${year}-${month}`);
      uniqueYears.add(parseInt(year));
    }
  }

  return {
    totalDates: uniqueDates.size,
    totalMonths: uniqueMonths.size,
    totalYears: uniqueYears.size,
    yearRange: `${Array.from(uniqueYears).sort()[0]} - ${Array.from(uniqueYears).sort().pop()}`,
    grandTotal: data.grandTotal,
    maxCount: data.maxCount,
    avgCount: Math.round(data.grandTotal / (uniqueDates.size * 24))
  };
}
