import { getFusedTrends } from "@/lib/supabase-client";
import type { FusedTrend } from "@/domain/types";

export async function TrendingSection() {
  const trends = await getFusedTrends({ limit: 30 });

  function formatChange(t: FusedTrend) {
    if (t.changePercent === null || t.changePercent === undefined) return '';
    const pct = Math.round(t.changePercent);
    if (pct > 0) return `+${pct}%`;
    if (pct < 0) return `${pct}%`;
    return '';
  }

  function sourceTag(t: FusedTrend) {
    return t.sourceLabels.length > 0 ? t.sourceLabels.join(' + ') : t.sources.join(' + ');
  }

  return (
    <section className="w-full">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">时尚情报热榜</h2>
        <span className="text-xs text-gray-400">
          更新于 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 列表 */}
      <div className="space-y-3">
        {trends.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">暂无情报数据</p>
            <p className="text-sm">等待下一次数据抓取与融合</p>
          </div>
        ) : (
          trends.map((trend, index) => (
            <div
              key={trend.id}
              className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* 排名 */}
                <div className="flex-shrink-0 w-8 pt-0.5 text-center">
                  <span className={`text-lg font-bold tabular-nums ${
                    index < 3 ? 'text-red-500' : 'text-gray-300'
                  }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  {/* 中文情报标题 */}
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    {trend.titleZh}
                  </h3>

                  {/* 英文副标题 */}
                  {trend.titleEn && trend.titleEn !== trend.titleZh && (
                    <p className="text-sm text-gray-400 mt-0.5 truncate">
                      {trend.titleEn}
                    </p>
                  )}

                  {/* 标签云 */}
                  {trend.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {trend.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 底部信息栏 */}
                  <div className="flex items-center gap-3 mt-2.5 text-sm">
                    {/* 热度分 */}
                    <span className="font-semibold text-red-500 tabular-nums">
                      {trend.score}°
                    </span>

                    {/* 趋势箭头 + 变化 */}
                    <span className="flex items-center gap-0.5">
                      {trend.direction === 'up' && (
                        <span className="text-red-500">🔺{formatChange(trend)}</span>
                      )}
                      {trend.direction === 'down' && (
                        <span className="text-green-600">🔻{formatChange(trend)}</span>
                      )}
                      {trend.direction === 'flat' && (
                        <span className="text-gray-400">➡️</span>
                      )}
                    </span>

                    {/* 来源标记 */}
                    <span className="text-xs text-gray-400 truncate">
                      {sourceTag(trend)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
