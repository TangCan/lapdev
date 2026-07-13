import type { SkillMarketEntry } from '../../types/skill';

interface SkillCardProps {
  skill: SkillMarketEntry;
  isInstalled: boolean;
  hasUpdate: boolean;
  isInstalling: boolean;
  onClick: () => void;
  onInstall: () => void;
  onUpdate: () => void;
}

export function SkillCard({
  skill,
  isInstalled,
  hasUpdate,
  isInstalling,
  onClick,
  onInstall,
  onUpdate,
}: SkillCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-xs ${i <= Math.floor(rating) ? 'text-[#d29922]' : 'text-[#3c3c3c]'}`}>
          ★
        </span>,
      );
    }
    return stars;
  };

  return (
    <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg p-4 cursor-pointer transition-all hover:border-[#007acc] hover:shadow-[0_2px_8px_rgba(0,122,204,0.2)] relative" data-testid={`skill-card-${skill.name}`} onClick={onClick}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-[#d4d4d4]">{skill.name}</span>
        <span className="text-xs text-[#858585] bg-[#3c3c3c] px-2 py-0.5 rounded">v{skill.version}</span>
      </div>

      <p className="text-xs text-[#b0b0b0] leading-relaxed mb-3 line-clamp-2">{skill.description}</p>

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-xs text-[#858585]">
          <span className="mr-1">👤</span>
          <span>{skill.author}</span>
        </div>
        <div className="flex items-center">
          {renderStars(skill.rating)}
          <span className="ml-1 text-xs text-[#d4d4d4]">{skill.rating}</span>
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        <span className="flex items-center text-xs text-[#858585]">
          <span className="mr-1">⬇️</span>
          <span>{skill.downloads}</span>
        </span>
        <span className="flex items-center text-xs text-[#858585]">
          <span className="mr-1">📅</span>
          <span>{skill.updatedAt}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {skill.tags.map((tag) => (
          <span key={tag} className="text-xs text-[#858585] bg-[#3c3c3c] px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-end">
        {hasUpdate ? (
          <button
            className="px-4 py-1.5 text-xs border-none rounded cursor-pointer transition-colors bg-[#3fb950] text-white hover:bg-[#238636] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate();
            }}
            disabled={isInstalling}
            data-testid={`skill-update-${skill.name}`}
          >
            {isInstalling ? '更新中...' : '更新'}
          </button>
        ) : isInstalled ? (
          <span className="px-4 py-1.5 text-xs bg-[#3c3c3c] text-[#858585] rounded cursor-default">已安装</span>
        ) : (
          <button
            className="px-4 py-1.5 text-xs border-none rounded cursor-pointer transition-colors bg-[#007acc] text-white hover:bg-[#005a9e] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              onInstall();
            }}
            disabled={isInstalling}
            data-testid={`skill-install-${skill.name}`}
          >
            {isInstalling ? '安装中...' : '安装'}
          </button>
        )}
      </div>

      {hasUpdate && (
        <div className="absolute top-2 right-2 text-[10px] text-[#3fb950] bg-[rgba(63,185,80,0.15)] px-2 py-0.5 rounded">
          新版本 v{skill.latestVersion}
        </div>
      )}
    </div>
  );
}