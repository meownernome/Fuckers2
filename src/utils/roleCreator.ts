import https from 'https';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function httpsPost(url: string, token: string, body: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST', timeout: 0,
      headers: {
        'Authorization': `Bot ${token}`, 'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let resp = '';
      res.on('data', (c: any) => resp += c);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
        else if (res.statusCode === 429) {
          try { const j = JSON.parse(resp); reject({ status: 429, retryAfter: j.retry_after || 5 }); }
          catch { reject({ status: 429, retryAfter: 5 }); }
        } else reject({ status: res.statusCode, body: resp.slice(0, 200) });
      });
    });
    const timer = setTimeout(() => { req.destroy(); reject({ status: 0, retryAfter: 5 }); }, 12000);
    req.on('close', () => clearTimeout(timer));
    req.on('error', () => { clearTimeout(timer); reject({ status: 0, retryAfter: 5 }); });
    req.write(data);
    req.end();
  });
}

export async function createRole(token: string, guildId: string, name: string, color: number): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await httpsPost(`https://discord.com/api/v10/guilds/${guildId}/roles`, token, { name, color, hoist: false, mentionable: false });
      return;
    } catch (e: any) {
      if (e?.retryAfter) {
        await sleep(Math.ceil(e.retryAfter * 1000) + 500);
      } else {
        if (attempt === 4) throw e;
        await sleep(5000);
      }
    }
  }
}
