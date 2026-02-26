'use client';

import { useState } from "react";

type Post = {
  id: string;
  initials: string;
  location: string;
  role: string;
  submittedAgo: string;
  status: "approved" | "pending";
  preview: string;
  likes: number;
};

const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    initials: "ST",
    location: "Shanghai",
    role: "Showroom Buyer",
    submittedAgo: "32 分钟前",
    status: "approved",
    preview: "今天路上红色单品明显变多，从外套到小面积包袋点缀，安静廓形 + 高亮色点缀是最常见组合。",
    likes: 128
  },
  {
    id: "p2",
    initials: "NY",
    location: "New York",
    role: "Stylist",
    submittedAgo: "1 小时前",
    status: "approved",
    preview: "客户更愿意为面料与版型付费，今天拍摄的三套造型全部用无 Logo 单品完成。",
    likes: 203
  },
  {
    id: "p3",
    initials: "TK",
    location: "Tokyo",
    role: "Fashion Student",
    submittedAgo: "3 小时前",
    status: "approved",
    preview: "长款大衣 + 运动鞋几乎成了校园制服，大家更在意「轻松」而不是「隆重」。",
    likes: 89
  },
  {
    id: "p4",
    initials: "LD",
    location: "London",
    role: "Editor",
    submittedAgo: "5 小时前",
    status: "approved",
    preview: "本周街拍中出现最多的是灰色西装与深色牛仔的组合。",
    likes: 156
  },
  {
    id: "p5",
    initials: "PA",
    location: "Paris",
    role: "PR Manager",
    submittedAgo: "6 小时前",
    status: "approved",
    preview: "今天的发布会上，几乎所有造型都选择了低跟鞋，高跟鞋出现频率明显下降。",
    likes: 178
  },
  {
    id: "p6",
    initials: "MI",
    location: "Milan",
    role: "Textile Designer",
    submittedAgo: "7 小时前",
    status: "approved",
    preview: "羊绒和美利奴羊毛的询单量比去年同期翻倍，客户对材质的要求越来越高。",
    likes: 145
  },
  {
    id: "p7",
    initials: "BJ",
    location: "Beijing",
    role: "Retail Manager",
    submittedAgo: "8 小时前",
    status: "approved",
    preview: "店里卖得最好的是基础款，消费者开始回归实穿性，不再追求夸张设计。",
    likes: 112
  },
  {
    id: "p8",
    initials: "SG",
    location: "Singapore",
    role: "Fashion Blogger",
    submittedAgo: "9 小时前",
    status: "approved",
    preview: "东南亚市场对轻薄面料的大衣需求很高，空调房穿搭成为新话题。",
    likes: 98
  },
  {
    id: "p9",
    initials: "SE",
    location: "Seoul",
    role: "K-Fashion Buyer",
    submittedAgo: "10 小时前",
    status: "approved",
    preview: "韩国市场的颜色偏好正在从黑白灰转向大地色系，驼色和米色最受欢迎。",
    likes: 134
  },
  {
    id: "p10",
    initials: "LA",
    location: "Los Angeles",
    role: "Celebrity Stylist",
    submittedAgo: "11 小时前",
    status: "approved",
    preview: "红毯造型越来越注重可持续性，很多明星主动要求穿着 vintage 或环保面料。",
    likes: 187
  },
  {
    id: "p11",
    initials: "SH",
    location: "Shanghai",
    role: "Trend Analyst",
    submittedAgo: "12 小时前",
    status: "approved",
    preview: "小红书上「安静奢华」相关笔记本周增长 200%，这个趋势还在加速。",
    likes: 223
  },
  {
    id: "p12",
    initials: "HK",
    location: "Hong Kong",
    role: "Vintage Dealer",
    submittedAgo: "13 小时前",
    status: "approved",
    preview: "经典款 Chanel 外套询价量创新高，二手市场对无 Logo 奢侈品更感兴趣。",
    likes: 167
  },
  {
    id: "p13",
    initials: "SY",
    location: "Sydney",
    role: "Fashion Photographer",
    submittedAgo: "14 小时前",
    status: "approved",
    preview: "今天拍摄发现模特们私下都穿得很简单，运动裤配 cashmere 毛衣是标配。",
    likes: 76
  },
  {
    id: "p14",
    initials: "DB",
    location: "Dubai",
    role: "Luxury Consultant",
    submittedAgo: "15 小时前",
    status: "approved",
    preview: "中东客户对定制服务需求激增，愿意等待 6 个月以上定制专属款式。",
    likes: 143
  },
  {
    id: "p15",
    initials: "AM",
    location: "Amsterdam",
    role: "Sustainable Fashion Advocate",
    submittedAgo: "16 小时前",
    status: "approved",
    preview: "欧洲消费者对品牌的碳足迹信息披露要求越来越高，透明度成为购买决策因素。",
    likes: 198
  }
];

function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  return (
    <article className={`border border-neutral-200 rounded-md px-3 ${compact ? 'py-1.5' : 'py-2'} bg-white`}>
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-neutral-900 text-[10px] text-white flex items-center justify-center flex-shrink-0">
            {post.initials}
          </div>
          <div className="text-[11px]">
            <p className="font-medium">
              {post.location} · {post.role}
            </p>
            <p className="text-neutral-400">
              {post.submittedAgo}
            </p>
          </div>
        </div>
        <span className="text-neutral-500 text-[10px]">
          ❤ {post.likes}
        </span>
      </div>
      <p className={`text-neutral-700 leading-snug ${compact ? 'line-clamp-2' : ''} text-[11px]`}>
        {post.preview}
      </p>
    </article>
  );
}

function InsiderModal({ posts, isOpen, onClose }: { posts: Post[]; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="font-display text-xl tracking-wide">
              💬 圈内新鲜事
            </h2>
            <p className="text-[11px] text-neutral-500 mt-1">
              共 {posts.length} 条来自业内人士的一手观察
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TodayAngle() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sorted = [...MOCK_POSTS].sort((a, b) => b.likes - a.likes);
  const visible = sorted.slice(0, 4);

  return (
    <>
      <div className="editor-card bg-neutral-50 h-full flex flex-col">
        <h2 className="section-title mb-1.5 text-lg">
          💬 圈内新鲜事
          <span className="text-xs font-normal text-neutral-500 ml-2">
            Insider Updates
          </span>
        </h2>
        <p className="text-[11px] text-neutral-600 mb-2">
          来自秀场后台、买手店与工作室的一手视角，按热度排序
        </p>
        <div className="space-y-1.5 text-[11px] text-neutral-700 flex-1 overflow-hidden">
          {visible.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-700 transition-colors py-1"
          >
            查看全部 {sorted.length} 条新鲜事
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <InsiderModal
        posts={sorted}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
