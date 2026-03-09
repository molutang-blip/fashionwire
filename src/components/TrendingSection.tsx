import { getTrendingTopics } from "@/lib/supabase-client";
import type { TrendingTopic } from "@/domain/types";

export async function TrendingSection() {
  const topics = await getTrendingTopics();

  // 简单的标签提取函数（基于标题关键词）
  function extractTags(topic: TrendingTopic): string[] {
    const tags: string[] = [];
    const title = (topic.titleZh || topic.titleEn || "").toLowerCase();
    
    // 品牌标签
    const brands = ["chanel", "lv", "gucci", "dior", "prada", "nike", "adidas"];
    brands.forEach(brand => {
      if (title.includes(brand)) tags.push(brand.charAt(0).toUpperCase() + brand.slice(1));
    });
    
    // 事件类型标签
    if (title.includes("联名") || title.includes("合作")) tags.push("联名合作");
    if (title.includes("发布") || title.includes("系列")) tags.push("新品发布");
    if (title.includes("秀") || title.includes("时装周")) tags.push("时装周");
    if (title.includes(" award") || title.includes("奖项")) tags.push("奖项");
    
    // 如果已经有 entities.brands，优先使用
    if (topic.entities?.brands?.length) {
      return topic.entities.brands.slice(0, 3);
    }
    
    return tags.slice(0, 3); // 最多显示3个标签
  }

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">实时热榜</h2>
        <span className="text-sm text-gray-500">
          更新于 {new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>

      <div className="space-y-4">
        {topics.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            暂无数据
          </div>
        ) : (
          topics.map((topic, index) => {
            const tags = extractTags(topic);
            return (
              <div 
                key={topic.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* 排名 */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className={`text-lg font-bold ${index < 3 ? 'text-red-500' : 'text-gray-400'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题区域 */}
                    <div className="mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {topic.titleZh}
                      </h3>
                      {topic.titleEn && (
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {topic.titleEn}
                        </p>
                      )}
                    </div>

                    {/* 标签云（新增） */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, i) => (
                          <span 
                            key={i} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 底部信息 */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <span className="text-red-500">{topic.score}°</span>
                      </span>
                      
                      {/* 趋势箭头 */}
                      <span className="flex items-center gap-1">
                        {topic.direction === 'up' && <span className="text-red-500">🔺</span>}
                        {topic.direction === 'down' && <span className="text-green-500">🔻</span>}
                        {topic.direction === 'flat' && <span className="text-gray-400">➡️</span>}
                      </span>

                      {/* 来源 */}
                      <span className="text-gray-400 text-xs">
                        {topic.sourceLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
