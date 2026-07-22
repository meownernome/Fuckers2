import { EmbedBuilder } from 'discord.js';

const S = '\u2501'; // ━
const D = '\u2501'; // ━

export function roleName(mode: string, tier: string): string {
  return `\u25C6 ${mode} \u2022 ${tier}`;
}

export function staffRoleName(emoji: string, name: string): string {
  return `${emoji} \u25C6 ${name}`;
}

export function catName(label: string): string {
  return `${S.repeat(4)} \u3014 ${label.toUpperCase()} \u3015 ${S.repeat(4)}`;
}

export function channelName(name: string): string {
  return `\u25C6\u30FB${name}`;
}

export const SEP = `${S.repeat(30)}`;

export function embedTitle(text: string): string {
  return `${SEP}\n\u3014 ${text} \u3015\n${SEP}`;
}

export function panel(title: string, body: string, color: number, footer?: string): EmbedBuilder {
  const e = new EmbedBuilder()
    .setDescription(`${SEP}\n\u3014 ${title} \u3015\n${SEP}\n\n${body}\n\n${SEP}`)
    .setColor(color)
    .setTimestamp();
  if (footer) e.setFooter({ text: `\u25C6 ${footer} \u25C6` });
  return e;
}

export function field(label: string, value: string): string {
  return `**${label}**\n${value}`;
}
