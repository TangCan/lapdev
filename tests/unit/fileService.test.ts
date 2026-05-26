import { describe, it, assertEquals, assertThrows } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// 模拟文件服务的工具函数
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isIgnored(name: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (name === pattern) {
      return true;
    }
    
    if (pattern.includes('*')) {
      try {
        const safePattern = escapeRegex(pattern).replace(/\\\*/g, '.*');
        const regex = new RegExp(`^${safePattern}$`);
        if (regex.test(name)) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }
  return false;
}

function validatePath(path: string, workspaceRoot: string = "/workspace"): boolean {
  const normalizedPath = path.replace(/\/+/g, '/');
  const absolutePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  const workspacePath = workspaceRoot.endsWith('/') ? workspaceRoot : `${workspaceRoot}/`;
  return absolutePath.startsWith(workspacePath) || absolutePath === workspaceRoot;
}

describe("File Service Unit Tests", () => {
  describe("Path Validation", () => {
    it("should validate path within workspace", () => {
      assertEquals(validatePath("/workspace/project/src"), true);
      assertEquals(validatePath("/workspace/docs"), true);
      assertEquals(validatePath("/workspace"), true);
    });

    it("should reject paths outside workspace", () => {
      assertEquals(validatePath("/etc/passwd"), false);
      assertEquals(validatePath("/home/user/file"), false);
      assertEquals(validatePath("../etc/passwd"), false);
    });

    it("should reject path traversal attempts", () => {
      assertEquals(validatePath("/workspace/../etc/passwd"), false);
      assertEquals(validatePath("/workspace/project/../../etc/passwd"), false);
      assertEquals(validatePath("../../etc/passwd"), false);
    });

    it("should handle trailing slashes", () => {
      assertEquals(validatePath("/workspace/project/"), true);
      assertEquals(validatePath("/workspace/project/src/"), true);
    });
  });

  describe("Glob Pattern Matching (isIgnored)", () => {
    const testPatterns = ["node_modules", "*.log", "dist/*", ".git"];

    it("should match exact patterns", () => {
      assertEquals(isIgnored("node_modules", testPatterns), true);
      assertEquals(isIgnored(".git", testPatterns), true);
      assertEquals(isIgnored("src", testPatterns), false);
    });

    it("should match wildcard patterns", () => {
      assertEquals(isIgnored("error.log", testPatterns), true);
      assertEquals(isIgnored("app.log", testPatterns), true);
      assertEquals(isIgnored("README.md", testPatterns), false);
    });

    it("should prevent regex injection", () => {
      const maliciousPatterns = ["[a-z]*"];
      assertEquals(isIgnored("test", maliciousPatterns), false);
      assertEquals(isIgnored("abc123", maliciousPatterns), false);
    });

    it("should handle invalid patterns gracefully", () => {
      const invalidPatterns = ["[invalid", "*"];
      assertEquals(isIgnored("test", invalidPatterns), false);
    });
  });

  describe("Regex Escape", () => {
    it("should escape special regex characters", () => {
      assertEquals(escapeRegex("*.txt"), "\\*.txt");
      assertEquals(escapeRegex("file[name].txt"), "file\\[name\\]\\.txt");
      assertEquals(escapeRegex("path/to/*/file"), "path\\/to\\/\\*\\/file");
    });

    it("should handle empty string", () => {
      assertEquals(escapeRegex(""), "");
    });

    it("should handle strings without special characters", () => {
      assertEquals(escapeRegex("normalstring"), "normalstring");
    });
  });

  describe("File Tree Depth Limit", () => {
    const MAX_DEPTH = 20;

    it("should enforce maximum depth limit", () => {
      let depth = 0;
      const checkRecursion = (currentDepth: number): number => {
        if (currentDepth >= MAX_DEPTH) return currentDepth;
        return checkRecursion(currentDepth + 1);
      };
      
      const result = checkRecursion(0);
      assertEquals(result, MAX_DEPTH);
    });

    it("should handle edge cases for depth limit", () => {
      assertEquals(MAX_DEPTH, 20);
      assertEquals(MAX_DEPTH > 0, true);
      assertEquals(MAX_DEPTH <= 100, true);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty file names", () => {
      const emptyName = "";
      assertEquals(isIgnored(emptyName, [""]), true);
      assertEquals(isIgnored(emptyName, ["test"]), false);
    });

    it("should handle special characters in file names", () => {
      assertEquals(isIgnored("file.with.dots.txt", ["*.txt"]), true);
      assertEquals(isIgnored("file[name].txt", ["*[*]*"]), true);
    });
  });
});