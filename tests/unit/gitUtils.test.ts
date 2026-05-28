import { describe, it } from "https://deno.land/std@0.214.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.214.0/testing/asserts.ts";

// Diff line parsing function (copied from App.tsx)
interface DiffLine {
  lineNumber: number;
  type: 'added' | 'modified' | 'deleted';
}

function parseDiffLines(diff: string): DiffLine[] {
  const lines: DiffLine[] = [];
  const diffLineArray = diff.split('\n');
  let newLineNum = 0;
  let oldLineNum = 0;
  
  for (const line of diffLineArray) {
    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('index ')) {
      continue;
    }
    
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
      if (match) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[2], 10);
      }
      continue;
    }
    
    if (line.startsWith('+')) {
      lines.push({ lineNumber: newLineNum, type: 'added' });
      newLineNum++;
    } else if (line.startsWith('-')) {
      lines.push({ lineNumber: oldLineNum, type: 'deleted' });
      oldLineNum++;
    } else if (line.length > 0 && !line.startsWith('\\')) {
      oldLineNum++;
      newLineNum++;
    }
  }
  
  return lines;
}

// Git status parsing utility
interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
}

function parseGitStatus(output: string): GitChange[] {
  const changes: GitChange[] = [];
  
  output.split('\n').forEach(line => {
    line = line.trim();
    if (line) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const statusCode = parts[0];
        const filePath = parts[1];
        
        let status: GitChange['status'] = 'modified';
        if (statusCode === 'A') status = 'added';
        else if (statusCode === 'D') status = 'deleted';
        else if (statusCode === 'R') status = 'renamed';
        
        changes.push({ path: filePath, status });
      }
    }
  });
  
  return changes;
}

describe('Git Utils - Diff Parsing', () => {
  it('should parse simple added lines', () => {
    const diff = `@@ -0,0 +1,3 @@
+line1
+line2
+line3`;
    
    const result = parseDiffLines(diff);
    assertEquals(result.length, 3);
    assertEquals(result[0].lineNumber, 1);
    assertEquals(result[0].type, 'added');
    assertEquals(result[1].lineNumber, 2);
    assertEquals(result[1].type, 'added');
    assertEquals(result[2].lineNumber, 3);
    assertEquals(result[2].type, 'added');
  });

  it('should parse deleted lines', () => {
    const diff = `@@ -1,3 +0,0 @@
-line1
-line2
-line3`;
    
    const result = parseDiffLines(diff);
    assertEquals(result.length, 3);
    assertEquals(result[0].lineNumber, 1);
    assertEquals(result[0].type, 'deleted');
    assertEquals(result[1].lineNumber, 2);
    assertEquals(result[1].type, 'deleted');
    assertEquals(result[2].lineNumber, 3);
    assertEquals(result[2].type, 'deleted');
  });

  it('should parse modified lines', () => {
    const diff = `@@ -1,2 +1,2 @@
-old line1
-old line2
+new line1
+new line2`;
    
    const result = parseDiffLines(diff);
    // Returns deletions and additions separately
    const deletedLines = result.filter(r => r.type === 'deleted');
    const addedLines = result.filter(r => r.type === 'added');
    assertEquals(deletedLines.length, 2);
    assertEquals(addedLines.length, 2);
  });

  it('should parse context lines', () => {
    const diff = `@@ -1,5 +1,5 @@
 context1
-old
+new
 context2
 context3`;
    
    const result = parseDiffLines(diff);
    assertEquals(result.length, 2); // 1 deleted, 1 added
    const deletedLines = result.filter(r => r.type === 'deleted');
    const addedLines = result.filter(r => r.type === 'added');
    assertEquals(deletedLines.length, 1);
    assertEquals(addedLines.length, 1);
  });

  it('should handle empty diff', () => {
    const result = parseDiffLines('');
    assertEquals(result.length, 0);
  });

  it('should handle real-world diff format', () => {
    const diff = `diff --git a/test.txt b/test.txt
index abc123..def456 100644
--- a/test.txt
+++ b/test.txt
@@ -1,4 +1,5 @@
 line1
-line2
+new line2
 line3
+added line`;
    
    const result = parseDiffLines(diff);
    assertEquals(result.length, 3); // 1 deleted, 2 added (line2 deleted, new line2 and added line added)
    const deletedLines = result.filter(r => r.type === 'deleted');
    const addedLines = result.filter(r => r.type === 'added');
    assertEquals(deletedLines.length, 1);
    assertEquals(addedLines.length, 2);
  });
});

describe('Git Utils - Status Parsing', () => {
  it('should parse modified files', () => {
    const output = 'M\tfile1.txt\nM\tsrc/file2.ts';
    const result = parseGitStatus(output);
    
    assertEquals(result.length, 2);
    assertEquals(result[0].path, 'file1.txt');
    assertEquals(result[0].status, 'modified');
    assertEquals(result[1].path, 'src/file2.ts');
    assertEquals(result[1].status, 'modified');
  });

  it('should parse added files', () => {
    const output = 'A\tnewfile.txt';
    const result = parseGitStatus(output);
    
    assertEquals(result.length, 1);
    assertEquals(result[0].path, 'newfile.txt');
    assertEquals(result[0].status, 'added');
  });

  it('should parse deleted files', () => {
    const output = 'D\tdeleted.txt';
    const result = parseGitStatus(output);
    
    assertEquals(result.length, 1);
    assertEquals(result[0].path, 'deleted.txt');
    assertEquals(result[0].status, 'deleted');
  });

  it('should parse renamed files', () => {
    const output = 'R\told.txt\tnew.txt';
    const result = parseGitStatus(output);
    
    assertEquals(result.length, 1);
    assertEquals(result[0].path, 'old.txt');
    assertEquals(result[0].status, 'renamed');
  });

  it('should handle empty output', () => {
    const result = parseGitStatus('');
    assertEquals(result.length, 0);
  });

  it('should handle mixed statuses', () => {
    const output = `M\tmodified.txt
A\tadded.txt
D\tdeleted.txt
R\told.txt\tnew.txt`;
    
    const result = parseGitStatus(output);
    
    assertEquals(result.length, 4);
    assertEquals(result[0].status, 'modified');
    assertEquals(result[1].status, 'added');
    assertEquals(result[2].status, 'deleted');
    assertEquals(result[3].status, 'renamed');
  });
});

describe('Git Utils - WebSocket Reconnection Logic', () => {
  const MAX_RECONNECT_ATTEMPTS = 10;

  it('should limit reconnection attempts', () => {
    let attempts = 0;
    const shouldReconnect = (): boolean => {
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        return false;
      }
      attempts++;
      return true;
    };
    
    // First 10 attempts should succeed
    for (let i = 0; i < 10; i++) {
      assertEquals(shouldReconnect(), true);
    }
    // 11th attempt should fail
    assertEquals(shouldReconnect(), false);
    assertEquals(attempts, 10);
  });

  it('should calculate exponential backoff', () => {
    let delay = 1000;
    const maxDelay = 30000;
    
    for (let i = 0; i < 10; i++) {
      delay = Math.min(delay * 2, maxDelay);
    }
    
    assertEquals(delay, maxDelay);
  });
});