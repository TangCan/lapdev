import type { Skill } from '../../types/skill';

interface SkillItemProps {
  skill: Skill;
  isActive: boolean;
  onDeactivate?: () => void;
}

export function SkillItem({ skill, isActive, onDeactivate }: SkillItemProps) {
  const displayScore = skill.matchScore !== undefined 
    ? (skill.matchScore * 100).toFixed(0) 
    : 'N/A';

  return (
    <div 
      className={`skill-item ${isActive ? 'active' : 'inactive'}`}
      data-testid={isActive ? 'active-skill' : 'deactivated-skill'}
    >
      <div className="skill-item-header">
        <span className="skill-status-icon">
          {isActive ? '✅' : '⬜'}
        </span>
        <span className="skill-name" data-testid="skill-name">
          {skill.name}
        </span>
        {isActive && (
          <span className="skill-match-score" data-testid="skill-match-score">
            匹配度: {displayScore}%
          </span>
        )}
      </div>
      {isActive && onDeactivate && (
        <button
          className="skill-deactivate-button"
          data-testid="deactivate-skill-button"
          onClick={onDeactivate}
        >
          禁用
        </button>
      )}
    </div>
  );
}