'use client';

export function TodayAngle() {
  const posts = [
    {
      id: "1",
      author: "时尚编辑 A",
      content: "今天的 Met Gala 红毯太精彩了，Zendaya 的造型绝对是全场焦点！",
      time: "2 小时前"
    },
    {
      id: "2", 
      author: "买手 Linda",
      content: "安静奢华风格持续升温，The Row 的包袋询问度暴增。",
      time: "4 小时前"
    },
    {
      id: "3",
      author: "趋势分析师",
      content: "红色系单品本周搜索量上涨 45%，预计将成为下季主打色。",
      time: "5 小时前"
    }
  ];

  return (
    <div className="editor-card h-full flex flex-col">
      <div className="badge mb-3">Insider · 业内视角</div>
      <h2 className="font-display text-lg mb-3">今日编辑精选</h2>
      <div className="space-y-3 flex-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border-l-2 border-brand/30 pl-3 py-1"
          >
            <p className="text-sm text-neutral-800 leading-relaxed">
              {post.content}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              {post.author} · {post.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
