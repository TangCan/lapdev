import { useBMAD } from '../context/BMADContext.tsx';

export function BMADPanel() {
  const { status, installationLog, isInstalling, enableBMAD, refreshStatus } = useBMAD();

  const handleEnableClick = async () => {
    await enableBMAD();
  };

  const handleRefresh = () => {
    refreshStatus();
  };

  return (
    <div className="bmad-panel">
      <div className="bmad-header">
        <span className="bmad-icon">🚀</span>
        <h2>BMAD敏捷工作流</h2>
      </div>

      <div className="bmad-status">
        {status === 'not-installed' && (
          <>
            <span className="status-icon warning">⚠️</span>
            <span className="status-text">当前未启用BMAD</span>
          </>
        )}
        {status === 'installing' && (
          <>
            <span className="status-icon loading">🔄</span>
            <span className="status-text">安装中...</span>
          </>
        )}
        {status === 'installed' && (
          <>
            <span className="status-icon success">✅</span>
            <span className="status-text">已启用</span>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="status-icon error">❌</span>
            <span className="status-text">安装失败</span>
          </>
        )}
      </div>

      {status === 'not-installed' && (
        <div className="bmad-description">
          <p>BMAD是一个强大的敏捷开发方法</p>
          <p>帮助团队提高开发效率和协作质量</p>
        </div>
      )}

      {status === 'installed' && (
        <div className="bmad-info">
          <p>版本: 1.0.0</p>
          <p>已加载BMAD技能</p>
        </div>
      )}

      <div className="bmad-actions">
        {status === 'not-installed' && (
          <button
            className="btn btn-primary"
            onClick={handleEnableClick}
            disabled={isInstalling}
          >
            {isInstalling ? '安装中...' : '启用BMAD工作流'}
          </button>
        )}
        {status === 'installed' && (
          <>
            <button className="btn btn-secondary" onClick={handleRefresh}>
              刷新状态
            </button>
            <button className="btn btn-outline">管理BMAD</button>
          </>
        )}
        {status === 'error' && (
          <button
            className="btn btn-primary"
            onClick={handleEnableClick}
            disabled={isInstalling}
          >
            重试安装
          </button>
        )}
      </div>

      {isInstalling && installationLog.length > 0 && (
        <div className="bmad-log">
          <h3>安装日志</h3>
          <div className="log-content">
            {installationLog.map((line, index) => (
              <div key={index} className="log-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && installationLog.length > 0 && (
        <div className="bmad-log error">
          <h3>错误日志</h3>
          <div className="log-content">
            {installationLog.map((line, index) => (
              <div key={index} className="log-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}