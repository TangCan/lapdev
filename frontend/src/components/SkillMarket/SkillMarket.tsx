import { useState } from 'react';
import { SkillSearch } from './SkillSearch';
import { SkillCard } from './SkillCard';
import { SkillDetail } from './SkillDetail';
import type { SkillMarketEntry } from '../../types/skill';

const MOCK_SKILLS: SkillMarketEntry[] = [
  {
    name: 'code-review',
    version: '1.0.0',
    latestVersion: '1.2.0',
    description: '智能代码审查工具，帮助发现潜在的代码问题和改进建议',
    author: 'lapdev',
    tags: ['code', 'review', 'quality'],
    rating: 4.8,
    downloads: 1523,
    updatedAt: '2026-07-10',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/code-review.skill.md',
  },
  {
    name: 'documentation',
    version: '1.0.0',
    latestVersion: '1.1.0',
    description: '自动生成代码文档，包括API文档和代码注释',
    author: 'lapdev',
    tags: ['docs', 'documentation', 'generator'],
    rating: 4.5,
    downloads: 892,
    updatedAt: '2026-07-08',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/documentation.skill.md',
  },
  {
    name: 'test-generator',
    version: '0.9.0',
    latestVersion: '1.0.0',
    description: '根据代码自动生成单元测试和集成测试',
    author: 'lapdev',
    tags: ['testing', 'test', 'generator'],
    rating: 4.6,
    downloads: 1103,
    updatedAt: '2026-07-12',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/test-generator.skill.md',
  },
  {
    name: 'refactor-assistant',
    version: '1.0.0',
    latestVersion: '1.0.0',
    description: '代码重构助手，提供重构建议和自动化重构',
    author: 'lapdev',
    tags: ['refactor', 'code', 'quality'],
    rating: 4.4,
    downloads: 654,
    updatedAt: '2026-07-05',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/refactor-assistant.skill.md',
  },
  {
    name: 'bug-finder',
    version: '1.1.0',
    latestVersion: '1.1.0',
    description: '智能Bug检测工具，帮助定位代码中的潜在缺陷',
    author: 'lapdev',
    tags: ['bug', 'debug', 'quality'],
    rating: 4.7,
    downloads: 987,
    updatedAt: '2026-07-09',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/bug-finder.skill.md',
  },
  {
    name: 'performance-analyzer',
    version: '1.0.0',
    latestVersion: '1.0.0',
    description: '性能分析工具，识别性能瓶颈和优化机会',
    author: 'lapdev',
    tags: ['performance', 'optimization', 'analysis'],
    rating: 4.3,
    downloads: 432,
    updatedAt: '2026-07-03',
    downloadUrl: 'https://github.com/lapdev/skills/raw/main/skills/performance-analyzer.skill.md',
  },
];

export function SkillMarket() {
  const [skills, setSkills] = useState<SkillMarketEntry[]>(MOCK_SKILLS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillMarketEntry | null>(null);
  const [installingSkill, setInstallingSkill] = useState<string | null>(null);
  const [installedSkills, setInstalledSkills] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim() === '') {
      setSkills(MOCK_SKILLS);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = MOCK_SKILLS.filter(
        (skill) =>
          skill.name.toLowerCase().includes(lowerQuery) ||
          skill.description.toLowerCase().includes(lowerQuery) ||
          skill.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      );
      setSkills(filtered);
    }
  };

  const handleSkillClick = (skill: SkillMarketEntry) => {
    setSelectedSkill(skill);
  };

  const handleCloseDetail = () => {
    setSelectedSkill(null);
  };

  const handleInstall = async (skillName: string) => {
    setInstallingSkill(skillName);
    setMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setInstalledSkills([...installedSkills, skillName]);
    setInstallingSkill(null);
    setMessage(`Skill "${skillName}" 安装成功！`);

    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdate = async (skillName: string) => {
    setInstallingSkill(skillName);
    setMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setInstallingSkill(null);
    setMessage(`Skill "${skillName}" 更新成功！`);

    setTimeout(() => setMessage(null), 3000);
  };

  const hasUpdate = (skill: SkillMarketEntry): boolean => {
    return installedSkills.includes(skill.name) && skill.version !== skill.latestVersion;
  };

  return (
    <div className="h-full flex flex-col bg-[#252526]" data-testid="skill-market">
      <div className="flex items-center px-4 py-3 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <span className="text-lg mr-2">🛒</span>
        <span className="text-base font-semibold text-[#d4d4d4]">Skill市场</span>
        <span className="ml-2 text-xs text-[#858585]">({skills.length} 个Skill)</span>
      </div>

      <SkillSearch onSearch={handleSearch} />

      {message && (
        <div className="px-3 py-2 text-xs text-center bg-[rgba(63,185,80,0.15)] text-[#3fb950]">
          {message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#858585]">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-sm mb-1">未找到匹配的Skill</p>
            <p className="text-xs text-[#6e7681]">尝试使用其他关键词搜索</p>
          </div>
        ) : (
          <div className="grid grid-cols-auto-fill minmax-[260px_1fr] gap-3">
            {skills.map((skill) => (
              <SkillCard
                key={skill.name}
                skill={skill}
                isInstalled={installedSkills.includes(skill.name)}
                hasUpdate={hasUpdate(skill)}
                isInstalling={installingSkill === skill.name}
                onClick={() => handleSkillClick(skill)}
                onInstall={() => handleInstall(skill.name)}
                onUpdate={() => handleUpdate(skill.name)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedSkill && (
        <SkillDetail
          skill={selectedSkill}
          isInstalled={installedSkills.includes(selectedSkill.name)}
          hasUpdate={hasUpdate(selectedSkill)}
          isInstalling={installingSkill === selectedSkill.name}
          onClose={handleCloseDetail}
          onInstall={() => handleInstall(selectedSkill.name)}
          onUpdate={() => handleUpdate(selectedSkill.name)}
        />
      )}
    </div>
  );
}