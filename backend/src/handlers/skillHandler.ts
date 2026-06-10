import { skillService } from '../services/skillService.ts';

export async function handleSkillLoad(_req: Request): Promise<Response> {
  try {
    const result = skillService.loadSkills();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleSkillMatch(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { query } = body;
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const skills = skillService.matchSkills(query);
    return new Response(JSON.stringify(skills), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleSkillRegister(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { skillsDir } = body;
    
    if (!skillsDir || typeof skillsDir !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid skills directory' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await skillService.registerSkillsFromDirectory(skillsDir);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleSkillList(_req: Request): Promise<Response> {
  try {
    const skills = skillService.getSkills();
    return new Response(JSON.stringify(skills), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
