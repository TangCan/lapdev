# Edge Case Hunter Review Input

## Diff Content

```diff
diff --git a/backend/src/handlers/bmadHandler.ts b/backend/src/handlers/bmadHandler.ts
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/backend/src/handlers/bmadHandler.ts
@@ -0,0 +1,50 @@
+import { BMADServiceImpl } from '../services/bmadService.ts';
+
+export async function handleBMADInstall(_req: Request) {
+  const workspacePath = Deno.cwd();
+  const bmadService = new BMADServiceImpl(workspacePath);
+
+  // 创建SSE响应
+  const stream = new ReadableStream({
+    async start(controller) {
+      try {
+        // 定义日志回调函数，实时发送日志
+        const onLog = (line: string) => {
+          controller.enqueue(`data: ${line}\n\n`);
+        };
+        
+        const result = await bmadService.installOnline(onLog);
+
+        // 发送最终结果
+        controller.enqueue(`data: ${JSON.stringify(result)}\n\n`);
+        controller.close();
+      } catch (error) {
+        controller.enqueue(`data: ${JSON.stringify({ success: false, error: error.message })}\n\n`);
+        controller.close();
+      }
+    },
+  });
+
+  return new Response(stream, {
+    headers: {
+      'Content-Type': 'text/event-stream',
+      'Cache-Control': 'no-cache',
+      'Connection': 'keep-alive',
+    },
+  });
+}
+
+export async function handleBMADStatus(_req: Request) {
+  const workspacePath = Deno.cwd();
+  const bmadService = new BMADServiceImpl(workspacePath);
+  
+  const isInstalled = await bmadService.isBMADInstalled();
+  
+  return Response.json({
+    status: isInstalled ? 'installed' : 'not-installed' as const,
+  });
+}
diff --git a/backend/src/main.ts b/backend/src/main.ts
index 0000000..1111111 100644
--- a/backend/src/main.ts
+++ b/backend/src/main.ts
@@ -52,6 +52,7 @@ import {
   handleAiCompletion
 } from './handlers/aiHandler.ts';
+import { handleBMADInstall, handleBMADStatus } from './handlers/bmadHandler.ts';

 const PORT = parseInt(Deno.env.get('PORT') || '3000');
-const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',');
+const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(',');

@@ -58,7 +59,6 @@ function getCorsHeaders(origin: string | null): Headers {
   const headers = new Headers({
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
-    'Content-Type': 'application/json'
   });
   
   if (origin && ALLOWED_ORIGINS.includes(origin)) {
@@ -380,6 +382,16 @@ async function handleRequest(req: Request): Promise<Response> {
     case '/api/v1/ai/completion':
       if (req.method === 'POST') {
         response = await handleAiCompletion(req);
       } else {
         response = new Response('Method Not Allowed', { status: 405 });
       }
       break;
+    case '/api/bmad/install':
+      if (req.method === 'POST') {
+        response = await handleBMADInstall(req);
+      } else {
+        response = new Response('Method Not Allowed', { status: 405 });
+      }
+      break;
+    case '/api/bmad/status':
+      if (req.method === 'GET') {
+        response = await handleBMADStatus(req);
+      } else {
+        response = new Response('Method Not Allowed', { status: 405 });
+      }
+      break;
     default:
       response = new Response('Not Found', { status: 404 });
   }

diff --git a/backend/src/services/bmadService.ts b/backend/src/services/bmadService.ts
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/backend/src/services/bmadService.ts
@@ -0,0 +1,120 @@
+import { exists, existsSync } from 'https://deno.land/std/fs/mod.ts';

+export type BMADStatus = 'not-installed' | 'installing' | 'installed' | 'error';

+export interface BMADService {
+  isBMADInstalled(): Promise<boolean>;
+  hasBMADDirectory(): boolean;
+  installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }>;
+  getStatus(): BMADStatus;
+  refreshStatus(): void;
+}

+export class BMADServiceImpl implements BMADService {
+  private status: BMADStatus = 'not-installed';
+  private workspacePath: string;

+  constructor(workspacePath: string) {
+    this.workspacePath = workspacePath;
+    this.refreshStatus();
+  }

+  hasBMADDirectory(): boolean {
+    const bmadPath = `${this.workspacePath}/_bmad`;
+    return existsSync(bmadPath);
+  }

+  async isBMADInstalled(): Promise<boolean> {
+    const bmadPath = `${this.workspacePath}/_bmad`;
+    return await exists(bmadPath);
+  }

+  getStatus(): BMADStatus {
+    return this.status;
+  }

+  refreshStatus(): void {
+    if (this.hasBMADDirectory()) {
+      this.status = 'installed';
+    } else {
+      this.status = 'not-installed';
+    }
+  }

+  async installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }> {
+    this.status = 'installing';
+    const log: string[] = [];

+    const addLog = (line: string) => {
+      log.push(line);
+      if (onLog) {
+        onLog(line);
+      }
+    };

+    try {
+      addLog('Starting BMAD installation...');
+      addLog('Executing: npx bmad-method install');

+      try {
+        const nodeCheck = new Deno.Command('node', {
+          args: ['--version'],
+          stdout: 'piped',
+          stderr: 'piped',
+        });
+        await nodeCheck.output();
+      } catch {
+        addLog('Warning: Node.js not found, will attempt fallback');
+      }

+      const command = new Deno.Command('npx', {
+        args: ['bmad-method', 'install'],
+        cwd: this.workspacePath,
+        stdout: 'piped',
+        stderr: 'piped',
+      });

+      const process = command.spawn();
+      const decoder = new TextDecoder();

+      const stdoutReader = process.stdout.getReader();
+      const stdoutPromise = (async () => {
+        while (true) {
+          const { done, value } = await stdoutReader.read();
+          if (done) break;
+          const output = decoder.decode(value);
+          output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
+        }
+      })();

+      const stderrReader = process.stderr.getReader();
+      const stderrPromise = (async () => {
+        while (true) {
+          const { done, value } = await stderrReader.read();
+          if (done) break;
+          const output = decoder.decode(value);
+          output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
+        }
+      })();

+      await Promise.all([stdoutPromise, stderrPromise]);
+      const status = await process.status;
+      const code = status.code;

+      if (code === 0) {
+        addLog('BMAD installation completed successfully');
+        this.status = 'installed';
+        addLog('BMAD skills registered successfully');

+        return { success: true, log };
+      } else {
+        addLog(`Installation failed with exit code ${code}`);
+        this.status = 'error';
+        return { success: false, error: `Installation failed with exit code ${code}`, log };
+      }
+    } catch (error) {
+      const err = error as Error;
+      addLog(`Installation error: ${err.message}`);
+      this.status = 'error';
+      return { success: false, error: err.message, log };
+    }
+  }
+}

diff --git a/frontend/src/services/bmadService.ts b/frontend/src/services/bmadService.ts
index 496076e..a5e9453 100644
--- a/frontend/src/services/bmadService.ts
+++ b/frontend/src/services/bmadService.ts
@@ -6,7 +6,7 @@ export type BMADStatus = 'not-installed' | 'installing' | 'installed' | 'error';
 export interface BMADService {
   isBMADInstalled(): Promise<boolean>;
   hasBMADDirectory(): boolean;
-  installOnline(): Promise<{ success: boolean; error?: string; log: string[] }>;
+  installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }>;
   getStatus(): BMADStatus;
   refreshStatus(): void;
 }
@@ -44,13 +44,20 @@ export class BMADServiceImpl implements BMADService {
     }
   }

-  async installOnline(): Promise<{ success: boolean; error?: string; log: string[] }> {
+  async installOnline(onLog?: (line: string) => void): Promise<{ success: boolean; error?: string; log: string[] }> {
     this.status = 'installing';
     const log: string[] = [];

+    const addLog = (line: string) => {
+      log.push(line);
+      if (onLog) {
+        onLog(line);
+      }
+    };

     try {
-      log.push('Starting BMAD installation...');
-      log.push('Executing: npx bmad-method install');
+      addLog('Starting BMAD installation...');
+      addLog('Executing: npx bmad-method install');

       try {
         const nodeCheck = new Deno.Command('node', {
           args: ['--version'],
@@ -61,7 +68,7 @@ export class BMADServiceImpl implements BMADService {
         });
         await nodeCheck.output();
       } catch {
-        log.push('Warning: Node.js not found, will attempt fallback');
+        addLog('Warning: Node.js not found, will attempt fallback');
       }

       const command = new Deno.Command('npx', {
@@ -72,35 +79,53 @@ export class BMADServiceImpl implements BMADService {
         stderr: 'piped',
       });

-      const { code, stdout, stderr } = await command.output();
-
-      const stdoutStr = new TextDecoder().decode(stdout);
-      const stderrStr = new TextDecoder().decode(stderr);
-
-      if (stdoutStr) {
-        log.push(...stdoutStr.split('\n').filter(line => line.trim()));
-      }
-      if (stderrStr) {
-        log.push(...stderrStr.split('\n').filter(line => line.trim()));
-      }
+      const process = command.spawn();
+      const decoder = new TextDecoder();
+
+      const stdoutReader = process.stdout.getReader();
+      const stdoutPromise = (async () => {
+        while (true) {
+          const { done, value } = await stdoutReader.read();
+          if (done) break;
+          const output = decoder.decode(value);
+          output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
+        }
+      })();

+      const stderrReader = process.stderr.getReader();
+      const stderrPromise = (async () => {
+        while (true) {
+          const { done, value } = await stderrReader.read();
+          if (done) break;
+          const output = decoder.decode(value);
+          output.split('\n').filter(line => line.trim()).forEach(line => addLog(line));
+        }
+      })();

+      await Promise.all([stdoutPromise, stderrPromise]);
+      const status = await process.status;
+      const code = status.code;

       if (code === 0) {
-        log.push('BMAD installation completed successfully');
+        addLog('BMAD installation completed successfully');
         this.status = 'installed';

         await this.registerBMADSkills();
-        log.push('BMAD skills registered successfully');
+        addLog('BMAD skills registered successfully');

         return { success: true, log };
       } else {
-        log.push(`Installation failed with exit code ${code}`);
+        addLog(`Installation failed with exit code ${code}`);
         this.status = 'error';
         return { success: false, error: `Installation failed with exit code ${code}`, log };
       }
     } catch (error) {
       const err = error as Error;
-      log.push(`Installation error: ${err.message}`);
+      addLog(`Installation error: ${err.message}`);
       this.status = 'error';
       return { success: false, error: err.message, log };
     }
   }
 }
```

## Instructions

You are an Edge Case Hunter reviewer. Walk every branching path and boundary condition in this diff, report only unhandled edge cases.

Output findings as a JSON array following this format:

```json
[{
  "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```