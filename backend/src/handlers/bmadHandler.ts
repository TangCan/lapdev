import { BMADServiceImpl } from '../services/bmadService.ts';

type SSEResult = { success: boolean; isOffline?: boolean; error?: string; log: string[] };

/**
 * 创建 SSE 流式响应的共享辅助函数
 * @param executeFn - 执行实际操作的函数，接收日志回调
 * @returns SSE 响应对象
 */
function createSSEResponse(executeFn: (onLog: (line: string) => void) => Promise<SSEResult>): Response {
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      
      // 心跳定时器，每30秒发送一次心跳
      const heartbeatInterval = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(`: heartbeat\n\n`);
          } catch {
            // 忽略心跳发送失败
          }
        }
      }, 30000);

      try {
        // 定义日志回调函数，实时发送日志
        const onLog = (line: string) => {
          if (!closed) {
            try {
              controller.enqueue(`data: ${line}\n\n`);
            } catch {
              // 忽略发送失败，可能客户端已断开
            }
          }
        };
        
        const result = await executeFn(onLog);

        // 发送最终结果
        if (!closed) {
          try {
            controller.enqueue(`data: ${JSON.stringify(result)}\n\n`);
          } catch {
            // 忽略发送失败
          }
        }
        closed = true;
        clearInterval(heartbeatInterval);
        controller.close();
      } catch (error) {
        closed = true;
        clearInterval(heartbeatInterval);
        const err = error as Error;
        const errorMessage = err.message ? err.message.substring(0, 500) : 'Unknown error';
        try {
          controller.enqueue(`data: ${JSON.stringify({ success: false, error: errorMessage })}\n\n`);
        } catch {
          // 忽略发送失败
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function handleBMADInstall(_req: Request) {
  const workspacePath = Deno.cwd();
  const bmadService = new BMADServiceImpl(workspacePath);

  return createSSEResponse((onLog) => bmadService.installOnline(onLog));
}

export async function handleBMADUpgrade(_req: Request) {
  const workspacePath = Deno.cwd();
  const bmadService = new BMADServiceImpl(workspacePath);

  return createSSEResponse((onLog) => bmadService.upgradeToFull(onLog));
}

export async function handleBMADStatus(_req: Request) {
  const workspacePath = Deno.cwd();
  const bmadService = new BMADServiceImpl(workspacePath);
  
  bmadService.refreshStatus();
  const status = bmadService.getStatus();
  
  return Response.json({
    status,
    isOffline: status === 'installed-offline',
  });
}