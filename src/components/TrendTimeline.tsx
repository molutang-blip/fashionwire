'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { TimelineData, TimelineEvent, TimelineEventType } from '@/domain/types';

interface TrendTimelineProps {
  data: TimelineData;
}

// 事件类型配置
const EVENT_CONFIG: Record<TimelineEventType, { icon: string; color: string; label: string }> = {
  first_post: { icon: '🚀', color: '#10B981', label: '首发' },
  peak_point: { icon: '📈', color: '#F59E0B', label: '爆发' },
  celebrity_join: { icon: '⭐', color: '#8B5CF6', label: '明星入场' },
  brand_response: { icon: '🏷️', color: '#3B82F6', label: '品牌回应' },
};

// 格式化日期显示
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 格式化完整日期
function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 自定义 Tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-neutral-900 mb-1">{formatFullDate(label)}</p>
        <p className="text-neutral-600">热度值: <span className="font-semibold text-brand">{payload[0]?.value?.toLocaleString()}</span></p>
      </div>
    );
  }
  return null;
}

// 事件标注点组件
function EventMarker({ event, x, y, onClick }: { event: TimelineEvent; x: number; y: number; onClick: () => void }) {
  const config = EVENT_CONFIG[event.type];
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={12} fill={config.color} opacity={0.2} />
      <circle cx={x} cy={y} r={8} fill={config.color} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="white">
        {config.icon}
      </text>
    </g>
  );
}

export function TrendTimeline({ data }: TrendTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // 处理数据，添加事件标记
  const chartData = useMemo(() => {
    return data.dataPoints.map(point => {
      const event = data.events.find(e => e.date === point.date);
      return {
        ...point,
        event,
      };
    });
  }, [data]);

  // 找出事件对应的数据点
  const eventPoints = useMemo(() => {
    return data.events.map(event => {
      const point = data.dataPoints.find(p => p.date === event.date);
      return {
        event,
        heatValue: point?.heatValue || 0,
        date: event.date,
      };
    });
  }, [data]);

  return (
    <div className="space-y-3">
      {/* 图表 */}
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: '#737373' }}
              axisLine={{ stroke: '#e5e5e5' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="heatValue"
              stroke="#D97757"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#D97757' }}
            />
            {/* 事件标记点 */}
            {eventPoints.map(ep => (
              <ReferenceDot
                key={ep.event.id}
                x={ep.date}
                y={ep.heatValue}
                r={6}
                fill={EVENT_CONFIG[ep.event.type].color}
                stroke="white"
                strokeWidth={2}
                onClick={() => setSelectedEvent(ep.event)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 事件图例 */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        {data.events.map(event => {
          const config = EVENT_CONFIG[event.type];
          const isSelected = selectedEvent?.id === event.id;
          return (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(isSelected ? null : event)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span>{config.icon}</span>
              <span>{event.title}</span>
            </button>
          );
        })}
      </div>

      {/* 选中事件详情 */}
      {selectedEvent && (
        <div
          className="p-3 rounded-lg border-l-4 bg-neutral-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ borderLeftColor: EVENT_CONFIG[selectedEvent.type].color }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span>{EVENT_CONFIG[selectedEvent.type].icon}</span>
            <span className="font-medium text-sm text-neutral-900">{selectedEvent.title}</span>
            <span className="text-[10px] text-neutral-400">{formatFullDate(selectedEvent.date)}</span>
          </div>
          {selectedEvent.description && (
            <p className="text-xs text-neutral-600">{selectedEvent.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
