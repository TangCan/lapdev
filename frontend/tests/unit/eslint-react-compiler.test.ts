import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const frontendDir = path.resolve(__dirname, '../..');
const eslintConfigPath = path.join(frontendDir, 'eslint.config.js');
const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
const packageJsonPath = path.join(frontendDir, 'package.json');

function readConfigFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('EPI1.02: React Compiler ESLint 配置验证', () => {

  describe('AC#3: ESLint react-compiler 规则', () => {

    it('[P1] eslint.config.js 中应包含 react-compiler 插件', () => {
      const config = readConfigFile(eslintConfigPath);
      expect(config).toContain('eslint-plugin-react-compiler');
      expect(config).toContain("'react-compiler': pluginReactCompiler");
    });

    it('[P1] eslint.config.js 中应包含 react-compiler/react-compiler 规则', () => {
      const config = readConfigFile(eslintConfigPath);
      expect(config).toContain("'react-compiler/react-compiler'");
    });

    it('[P1] react-compiler 规则应设置为 warn 级别', () => {
      const config = readConfigFile(eslintConfigPath);
      const reactCompilerRuleMatch = config.match(
        /'react-compiler\/react-compiler'\s*:\s*'warn'/
      );
      expect(reactCompilerRuleMatch).not.toBeNull();
    });
  });

  describe('AC#3: 现有 ESLint 规则兼容性', () => {

    it('[P1] set-state-in-effect 规则应继续存在', () => {
      const config = readConfigFile(eslintConfigPath);
      expect(config).toContain("'react-hooks/set-state-in-effect'");
    });

    it('[P1] immutability 规则应继续存在', () => {
      const config = readConfigFile(eslintConfigPath);
      expect(config).toContain("'react-hooks/immutability'");
    });

    it('[P1] react/react-in-jsx-scope 应关闭（React 19 不需要）', () => {
      const config = readConfigFile(eslintConfigPath);
      expect(config).toContain("'react/react-in-jsx-scope': 'off'");
    });
  });
});

describe('EPI1.02: React Compiler Vite 配置验证', () => {

  describe('AC#1 & AC#2: Vite Babel 插件配置', () => {

    it('[P0] vite.config.ts 中 react 插件应配置 babel plugins', () => {
      const config = readConfigFile(viteConfigPath);
      expect(config).toContain('babel');
      expect(config).toContain('babel-plugin-react-compiler');
    });

    it('[P0] babel-plugin-react-compiler 应在 plugins 数组第一位', () => {
      const config = readConfigFile(viteConfigPath);
      const babelPluginsMatch = config.match(/babel:\s*\{\s*plugins:\s*\[([\s\S]*?)\]/);
      expect(babelPluginsMatch).not.toBeNull();
      if (babelPluginsMatch) {
        const pluginsContent = babelPluginsMatch[1];
        const firstPluginMatch = pluginsContent.match(/^\s*\[?\s*'([^']+)'/);
        expect(firstPluginMatch).not.toBeNull();
        if (firstPluginMatch) {
          expect(firstPluginMatch[1]).toContain('babel-plugin-react-compiler');
        }
      }
    });

    it('[P1] React Compiler target 应配置为 19', () => {
      const config = readConfigFile(viteConfigPath);
      expect(config).toContain("target: '19'");
    });

    it('[P1] React Compiler compilationMode 应配置为 infer', () => {
      const config = readConfigFile(viteConfigPath);
      expect(config).toContain("compilationMode: 'infer'");
    });
  });

  describe('AC#1: 依赖安装验证', () => {

    it('[P0] package.json 应包含 babel-plugin-react-compiler 依赖', () => {
      const packageJson = JSON.parse(readConfigFile(packageJsonPath));
      const devDeps = packageJson.devDependencies || {};
      expect(devDeps['babel-plugin-react-compiler']).toBeDefined();
    });

    it('[P0] package.json 应包含 eslint-plugin-react-compiler 依赖', () => {
      const packageJson = JSON.parse(readConfigFile(packageJsonPath));
      const devDeps = packageJson.devDependencies || {};
      expect(devDeps['eslint-plugin-react-compiler']).toBeDefined();
    });

    it('[P0] @vitejs/plugin-react 版本应 >= 5.2.0', () => {
      const packageJson = JSON.parse(readConfigFile(packageJsonPath));
      const version = packageJson.devDependencies['@vitejs/plugin-react'];
      const cleanVersion = version.replace(/[^\d.]/g, '');
      const parts = cleanVersion.split('.').map(Number);
      expect(parts[0]).toBeGreaterThanOrEqual(5);
      expect(parts[1]).toBeGreaterThanOrEqual(2);
    });
  });
});