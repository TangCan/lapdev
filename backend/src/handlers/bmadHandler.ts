import { HandlerContext } from '$fresh/server.ts';
import { BMADServiceImpl } from '../../frontend/src/services/bmadService.ts';
import { SkillServiceImpl } from '../../frontend/src/services/skillService.ts';

export async function POST(_req: Request, ctx: HandlerContext) {
  const workspacePath = Deno.cwd();
  const skillService = new SkillServiceImpl();
  const bmadService = new BMADServiceImpl(workspacePath, skillService);

  // 创建SSE响应
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await bmadService.installOnline();
        
        // 发送安装日志
        result.log.forEach(line => {
          controller.enqueue(`data: ${line}\n\n`);
        });

        // 发送最终结果
        controller.enqueue(`data: ${JSON.stringify(result)}\n\n`);
        controller.close();
      } catch (error) {
        controller.enqueue(`data: ${JSON.stringify({ success: false, error: error.message })}\n\n`);
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

export async function GET(_req: Request, ctx: HandlerContext) {
  const workspacePath = Deno.cwd();
  const skillService = new SkillServiceImpl();
  const bmadService = new BMADServiceImpl(workspacePath, skillService);
  
  const isInstalled = await bmadService.isBMADInstalled();
  
  return Response.json({
    status: isInstalled ? 'installed' : 'not-installed' as const,
  });
}