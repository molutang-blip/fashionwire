import { getTrendingTopics } from "@/lib/supabase-client";
import type { TrendingTopic } from "@/domain/types";

export async function TrendingSection() {
  const topics = await getTrendingTopics();
  
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">实时热榜</h2>
        <span className="text-sm text-neutral-500">
          更新于 {new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>
      
      <div className="space-y-3">
        {topics.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">暂无数据</p>
        ) : (
          topics.map((topic, index) => (
            <div 
              key={topic.id}
              className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl font-bold text-neutral-300 w-8">
                  {String(index + 1).padStart(2, '0')}
                </span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-medium text-neutral-900">
                      {topic.titleZh}
                    </h3>
                    {topic.titleEn && (
                      <span className="text-sm text-neutral-500">
                        {topic.titleEn}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span className="font-medium text-orange-600">
                      {topic.score}°
                    </span>
                    
                    <span className={`
                      ${topic.direction === 'up' ? 'text-red-500' : ''}
                      ${topic.direction === 'down' ? 'text-green-500' : ''}
                      ${topic.direction === 'flat' ? 'text-neutral-400' : ''}
                    `}>
                      {topic.direction === 'up' && '🔺'}
                      {topic.direction === 'down' && '🔻'}
                      {topic.direction === 'flat' && '➡️'}
                    </span>
                    
                    <span className="text-neutral-400 text-xs">
                      {topic.sourceLabel}
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
