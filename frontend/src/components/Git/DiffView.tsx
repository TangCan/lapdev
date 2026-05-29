import React, { useMemo } from 'react';
import { html } from 'diff2html/lib-esm/diff2html.js';
import DOMPurify from 'isomorphic-dompurify';
import 'diff2html/bundles/css/diff2html.min.css';
import { useGit } from '../../context/GitContext';

// DOMPurify 配置：只允许 diff2html 生成的 HTML 标签
const DIFF2HTML_ALLOWED_TAGS = [
  'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'pre', 'code', 'a', 'br', 'hr'
];

const DIFF2HTML_ALLOWED_ATTR = [
  'class', 'id', 'data', 'data-line-number', 'data-type',
  'href', 'target', 'rel', 'style', 'width', 'height'
];

const DiffView: React.FC = () => {
  const { selectedFileDiff, selectedFilePath } = useGit();

  const htmlDiff = useMemo(() => {
    if (!selectedFileDiff) return '';
    
    try {
      // 解析 diff 并生成 HTML
      const rawHtml = html(selectedFileDiff, {
        outputFormat: 'side-by-side',
        drawFileList: true,
        matching: 'lines',
        matchWordsThreshold: 0.25,
        maxLineLengthHighlight: 1000
      });
      
      // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        // 只允许白名单中的标签
        ALLOWED_TAGS: DIFF2HTML_ALLOWED_TAGS,
        // 只允许白名单中的属性
        ALLOWED_ATTR: DIFF2HTML_ALLOWED_ATTR,
        // 禁止自定义数据属性
        ALLOW_DATA_ATTR: false,
        // 强制移除所有事件处理器
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        // 强制移除 JavaScript URL
        FORCE_BODY: false,
        // 保持 HTML 结构完整
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      });
      
      return sanitizedHtml;
    } catch (error) {
      console.error('Failed to parse diff:', error);
      return '<div class="diff-error">Failed to parse diff</div>';
    }
  }, [selectedFileDiff]);

  if (!selectedFileDiff) return null;

  return (
    <div className="diff-view" data-testid="diff-view">
      <div className="diff-header">
        <span className="file-name">{selectedFilePath}</span>
      </div>
      <div 
        className="diff-content"
        dangerouslySetInnerHTML={{ __html: htmlDiff }}
      />
    </div>
  );
};

export default DiffView;