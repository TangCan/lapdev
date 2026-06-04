import { useSkill } from '../../context/SkillContext';
import { SkillItem } from './SkillItem';

export function SkillPanel() {
  const { activeSkills, skills, deactivateSkill } = useSkill();

  const activeSkillList = skills.filter(skill => skill.id && activeSkills.includes(skill.id));

  return (
    <div className="skill-panel" data-testid="skill-panel">
      <div className="skill-panel-header">
        <span className="skill-panel-icon">🎯</span>
        <span className="skill-panel-title">已激活Skill ({activeSkillList.length})</span>
      </div>
      <div className="skill-panel-content">
        {activeSkillList.map(skill => (
          <SkillItem
            key={skill.id}
            skill={skill}
            isActive={true}
            onDeactivate={() => skill.id && deactivateSkill(skill.id)}
          />
        ))}
      </div>
    </div>
  );
}