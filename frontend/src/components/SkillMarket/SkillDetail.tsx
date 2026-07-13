import type { SkillMarketEntry } from '../../types/skill';

interface SkillDetailProps {
  skill: SkillMarketEntry;
  isInstalled: boolean;
  hasUpdate: boolean;
  isInstalling: boolean;
  onClose: () => void;
  onInstall: () => void;
  onUpdate: () => void;
}

export function SkillDetail({
  skill,
  isInstalled,
  hasUpdate,
  isInstalling,
  onClose,
  onInstall,
  onUpdate,
}: SkillDetailProps) {
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
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-[2000]" onClick={onClose} data-testid="skill-detail-overlay">
      <div
        className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg w-[90%] max-w-[500px] max-h-[80vh] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="skill-detail"
      >
        <div className="flex justify-between items-center p-4 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <h2 className="text-lg font-semibold text-[#d4d4d4] m-0">{skill.name}</h2>
              <span className="text-xs text-[#858585] mr-2">v{skill.version}</span>
              {hasUpdate && (
                <span className="text-xs text-[#3fb950]">最新: v{skill.latestVersion}</span>
              )}
            </div>
          </div>
          <button className="bg-transparent border-none text-[#858585] text-lg cursor-pointer p-1 rounded transition-colors hover:bg-[#3c3c3c] hover:text-[#d4d4d4]" onClick={onClose} data-testid="skill-detail-close">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div>
            <h3 className="text-sm font-semibold text-[#d4d4d4] mb-2">描述</h3>
            <p className="text-sm text-[#b0b0b0] leading-relaxed">{skill.description}</p>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[#d4d4d4] mb-2">信息</h3>
            <div className="flex justify-between py-2 border-b border-[#3c3c3c]">
              <span className="text-sm text-[#858585]">作者</span>
              <span className="text-sm text-[#d4d4d4]">{skill.author}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#3c3c3c]">
              <span className="text-sm text-[#858585]">评分</span>
              <span className="text-sm text-[#d4d4d4]">
                {renderStars(skill.rating)}
                <span className="ml-2">{skill.rating}</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#3c3c3c]">
              <span className="text-sm text-[#858585]">下载量</span>
              <span className="text-sm text-[#d4d4d4]">{skill.downloads}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#3c3c3c]">
              <span className="text-sm text-[#858585]">更新时间</span>
              <span className="text-sm text-[#d4d4d4]">{skill.updatedAt}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#3c3c3c]">
              <span className="text-sm text-[#858585]">下载地址</span>
              <a
                href={skill.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#007acc] hover:underline"
              >
                {skill.downloadUrl}
              </a>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[#d4d4d4] mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <span key={tag} className="text-xs text-[#858585] bg-[#3c3c3c] px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-[#3c3c3c]">
          {hasUpdate ? (
            <button
              className="px-6 py-2 text-sm border-none rounded cursor-pointer transition-colors bg-[#3fb950] text-white hover:bg-[#238636] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onUpdate}
              disabled={isInstalling}
              data-testid="skill-detail-update"
            >
              {isInstalling ? '更新中...' : '更新到 v' + skill.latestVersion}
            </button>
          ) : isInstalled ? (
            <span className="px-6 py-2 text-sm bg-[#3c3c3c] text-[#858585] rounded cursor-default">已安装</span>
          ) : (
            <button
              className="px-6 py-2 text-sm border-none rounded cursor-pointer transition-colors bg-[#007acc] text-white hover:bg-[#005a9e] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onInstall}
              disabled={isInstalling}
              data-testid="skill-detail-install"
            >
              {isInstalling ? '安装中...' : '安装'}
            </button>
          )}
          <button className="px-6 py-2 text-sm border-none rounded cursor-pointer transition-colors bg-[#3c3c3c] text-[#d4d4d4] hover:bg-[#4a4a4a]" onClick={onClose} data-testid="skill-detail-cancel">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}