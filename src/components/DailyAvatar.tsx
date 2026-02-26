'use client';

import { useMemo } from 'react';

interface DailyAvatarProps {
  hotTopic: string;
  styleKeyword: string;
  hotCategory: string;
  focusArea: string;
}

export function DailyAvatar({ hotTopic, styleKeyword, hotCategory, focusArea }: DailyAvatarProps) {
  const avatarStyle = useMemo(() => {
    const colorSchemes: Record<string, { primary: string; secondary: string; accent: string }> = {
      '安静奢华': { primary: '#E8E4DE', secondary: '#C9B99A', accent: '#8B7355' },
      '极简': { primary: '#F5F5F5', secondary: '#2C2C2C', accent: '#666666' },
      '红色': { primary: '#8B0000', secondary: '#FFE4E1', accent: '#DC143C' },
      'default': { primary: '#D97757', secondary: '#F5E6E0', accent: '#B85C3C' }
    };

    let scheme = colorSchemes['default'];
    if (styleKeyword.includes('安静') || styleKeyword.includes('奢华')) {
      scheme = colorSchemes['安静奢华'];
    } else if (styleKeyword.includes('极简')) {
      scheme = colorSchemes['极简'];
    } else if (hotCategory.includes('红色')) {
      scheme = colorSchemes['红色'];
    }

    const hasHeels = hotCategory.includes('高跟鞋');
    const hasBag = hotCategory.includes('包') || focusArea.includes('包袋');
    const hasCoat = styleKeyword.includes('大衣') || hotTopic.includes('秋冬');

    return { scheme, hasHeels, hasBag, hasCoat };
  }, [hotTopic, styleKeyword, hotCategory, focusArea]);

  const { scheme, hasHeels, hasBag, hasCoat } = avatarStyle;

  return (
    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-lg opacity-20"
        style={{
          background: `linear-gradient(135deg, ${scheme.secondary} 0%, ${scheme.primary} 100%)`
        }}
      />

      <svg
        viewBox="0 0 200 280"
        className="relative z-10 w-auto h-full max-h-[240px]"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
      >
        <ellipse cx="100" cy="45" rx="35" ry="40" fill="#2C2C2C" />
        <path d="M65 45 Q60 80 70 100 Q80 85 100 80 Q120 85 130 100 Q140 80 135 45" fill="#2C2C2C" />
        <ellipse cx="100" cy="55" rx="28" ry="32" fill="#F5E1D0" />
        <ellipse cx="88" cy="52" rx="4" ry="2.5" fill="#2C2C2C" />
        <ellipse cx="112" cy="52" rx="4" ry="2.5" fill="#2C2C2C" />
        <path d="M82 46 Q88 44 94 46" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />
        <path d="M106 46 Q112 44 118 46" stroke="#4A4A4A" strokeWidth="1.5" fill="none" />
        <path d="M94 68 Q100 72 106 68" stroke={scheme.accent} strokeWidth="2" fill="none" />
        <rect x="92" y="82" width="16" height="15" fill="#F5E1D0" />

        {hasCoat ? (
          <>
            <path d="M60 95 L75 95 L80 180 L60 240 L60 95" fill={scheme.primary} stroke={scheme.secondary} strokeWidth="1" />
            <path d="M140 95 L125 95 L120 180 L140 240 L140 95" fill={scheme.primary} stroke={scheme.secondary} strokeWidth="1" />
            <rect x="75" y="95" width="50" height="145" fill={scheme.primary} />
            <path d="M75 95 L85 110 L85 95" fill={scheme.secondary} />
            <path d="M125 95 L115 110 L115 95" fill={scheme.secondary} />
            <circle cx="100" cy="130" r="3" fill={scheme.accent} />
            <circle cx="100" cy="150" r="3" fill={scheme.accent} />
          </>
        ) : (
          <>
            <path d="M70 95 L130 95 L125 160 L75 160 Z" fill={scheme.primary} />
            <path d="M85 95 L100 110 L115 95" fill={scheme.secondary} stroke={scheme.secondary} />
            <path d="M75 160 L80 240 L95 240 L100 175 L105 240 L120 240 L125 160 Z" fill="#2C2C2C" />
          </>
        )}

        <path d="M60 100 Q45 130 50 160" stroke={hasCoat ? scheme.primary : '#F5E1D0'} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M140 100 Q155 130 150 160" stroke={hasCoat ? scheme.primary : '#F5E1D0'} strokeWidth="12" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="165" r="8" fill="#F5E1D0" />
        <circle cx="150" cy="165" r="8" fill="#F5E1D0" />

        {hasBag && (
          <g transform="translate(145, 140)">
            <rect x="0" y="0" width="25" height="20" rx="3" fill={scheme.accent} />
            <rect x="0" y="-5" width="25" height="5" rx="2" fill={scheme.accent} opacity="0.8" />
            <rect x="8" y="6" width="9" height="1" fill={scheme.secondary} />
          </g>
        )}

        {hasHeels ? (
          <>
            <path d="M75 240 L80 240 L82 255 L85 270 L75 270 L78 255 Z" fill={scheme.accent} />
            <path d="M85 270 L75 270 L73 275 L88 275 Z" fill={scheme.accent} />
            <path d="M115 240 L120 240 L118 255 L115 270 L125 270 L122 255 Z" fill={scheme.accent} />
            <path d="M115 270 L125 270 L127 275 L112 275 Z" fill={scheme.accent} />
          </>
        ) : (
          <>
            <ellipse cx="87" cy="245" rx="12" ry="5" fill="#2C2C2C" />
            <ellipse cx="113" cy="245" rx="12" ry="5" fill="#2C2C2C" />
          </>
        )}
      </svg>

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <span className="text-[9px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: scheme.accent }}>
          {styleKeyword}
        </span>
      </div>

      <div className="absolute bottom-2 left-2 right-2 text-center">
        <p className="text-[10px] text-neutral-500">Today's Style · AI Generated</p>
      </div>
    </div>
  );
}
