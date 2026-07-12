function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function createRole(token: string, guildId: string, name: string, color: number): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, color, hoist: false, mentionable: false }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return;
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        const retryAfter = (j as any).retry_after || 5;
        await sleep(Math.ceil(retryAfter * 1000) + 1000);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        await sleep(3000);
        continue;
      }
      if (attempt === 4) throw e;
      await sleep(5000);
    }
  }
}
