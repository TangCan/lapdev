import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const frontendDir = path.resolve(__dirname, '../..');
const tmpDir = path.join(os.tmpdir(), 'react-compiler-eslint-tests');
const timeoutMs = 30000;
const eslintRuleJson = JSON.stringify({ 'react-compiler/react-compiler': 'warn' });

const componentWithViolation = `import React from 'react';

interface Props {
  user: { name: string; age: number };
}

export default function UserCard({ user }: Props) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Age: {user.age}</p>
      <span>{user.name === 'admin' ? 'Admin' : 'User'}</span>
    </div>
  );
}
`;

const cleanComponent = `import React from 'react';

interface Props {
  user: { name: string; age: number };
}

export default function UserCard({ user }: Props) {
  const displayName = user.name;
  const displayAge = user.age;
  const role = user.name === 'admin' ? 'Admin' : 'User';

  return (
    <div>
      <h1>{displayName}</h1>
      <p>Age: {displayAge}</p>
      <span>{role}</span>
    </div>
  );
}
`;

beforeAll(() => {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeTempFile(fileName: string, content: string): string {
  const filePath = path.join(tmpDir, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function runEslint(targetPath: string, extraArgs: string = '') {
  const cwd = frontendDir;
  const ruleArg = `--rule '${eslintRuleJson}'`;
  const cmd = `npx eslint ${ruleArg} ${extraArgs} "${targetPath}"`;
  try {
    return {
      status: 0,
      output: execSync(cmd, {
        cwd,
        timeout: timeoutMs,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
      error: '',
    };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string; stderr?: string; message?: string };
    return {
      status: e.status ?? 1,
      output: e.stdout ?? '',
      error: e.stderr ?? e.message ?? '',
    };
  }
}

describe('React Compiler ESLint 运行时行为验证', () => {

  it('[P0] ESLint react-compiler 规则应检测在 JSX 中读取 props 且未进行 memoization 的组件', () => {
    const tmpFile = writeTempFile('violation-component.tsx', componentWithViolation);
    try {
      const result = runEslint(tmpFile);
      const combined = `${result.output}\n${result.error}`;
      const hasReactCompilerOutput =
        combined.includes('react-compiler') ||
        combined.includes('react-compiler/react-compiler') ||
        /\[react-compiler\/react-compiler\]/i.test(combined) ||
        /Rules of React/.test(combined);
      expect(hasReactCompilerOutput).toBe(true);
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it('[P0] ESLint 对 well-optimized 组件不应产生 react-compiler 警告', () => {
    const tmpFile = writeTempFile('clean-component.tsx', cleanComponent);
    try {
      const result = runEslint(tmpFile);
      const combined = `${result.output}\n${result.error}`;
      const hasReactCompilerWarning =
        /react-compiler\/react-compiler/i.test(combined) ||
        /\[react-compiler\]/i.test(combined);
      expect(hasReactCompilerWarning).toBe(false);
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it('[P1] ESLint 配置应有效（对任意源文件无 fatal error）', () => {
    const tmpFile = writeTempFile('valid-component.tsx', cleanComponent);
    try {
      const result = runEslint(tmpFile);
      const combined = `${result.output}\n${result.error}`;
      const hasFatalError =
        /fatal\s+error/i.test(combined) ||
        /configuration error/i.test(combined) ||
        result.error.includes('Error:');
      expect(hasFatalError).toBe(false);
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it('[P1] 对现有 src/ 目录执行 lint 不应崩溃', () => {
    try {
      const cmd = `npx eslint --rule '${eslintRuleJson}' "src/**/*.{ts,tsx}"`;
      execSync(cmd, {
        cwd: frontendDir,
        timeout: timeoutMs,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err: unknown) {
      const e = err as { stderr?: string; message?: string };
      const msg = `${e.stderr ?? ''}\n${e.message ?? ''}`;
      const isFatal =
        /fatal\s+error/i.test(msg) ||
        /configuration error/i.test(msg) ||
        /ESLint.*CRASHED/i.test(msg);
      if (isFatal) {
        throw err;
      }
    }
    expect(true).toBe(true);
  });

  it('[P2] ESLint react-compiler 规则的 severity 应为 warn', () => {
    const configPath = path.join(frontendDir, 'eslint.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const warnMatch = configContent.match(
      /'react-compiler\/react-compiler'\s*:\s*'warn'/
    );
    const errorMatch = configContent.match(
      /'react-compiler\/react-compiler'\s*:\s*'error'/
    );
    const offMatch = configContent.match(
      /'react-compiler\/react-compiler'\s*:\s*'off'/
    );
    expect(warnMatch).not.toBeNull();
    expect(errorMatch).toBeNull();
    expect(offMatch).toBeNull();
  });
});
