import { REST, RESTPostAPIGuildRoleJSONBody, RESTGetAPIGuildRolesResult, Routes, RateLimitError } from 'discord.js';
import { Logger } from '../utils/Logger.js';

const REST_DELAY_MS = 1200;

export interface RoleData {
  name: string;
  color: number;
  permissions?: string;
}

export class RoleCreator {
  private rest: REST;
  private guildId: string;

  constructor(token: string, guildId: string) {
    this.rest = new REST({ version: '10' }).setToken(token);
    this.guildId = guildId;
  }

  async createRole(roleData: RoleData): Promise<string | null> {
    try {
      const body: RESTPostAPIGuildRoleJSONBody = {
        name: roleData.name,
        color: roleData.color,
        permissions: roleData.permissions || '0',
        mentionable: false,
        hoist: false,
      };

      const role = await this.rest.post(
        Routes.guildRoles(this.guildId),
        { body }
      ) as { id: string; name: string };

      Logger.success(`Created role: ${roleData.name} (${role.id})`);
      return role.id;
    } catch (error: unknown) {
      const restError = error as { status?: number; rawError?: { retry_after?: number; code?: number; message?: string } };

      if (restError.status === 429) {
        const retryAfter = (restError.rawError?.retry_after ?? 5) * 1000;
        Logger.warn(`Rate limited on ${roleData.name}, waiting ${retryAfter}ms`);
        await this.delay(retryAfter);
        return await this.createRole(roleData);
      }

      if (restError.status === 400 && restError.rawError?.code === 50035) {
        Logger.warn(`Role name invalid: ${roleData.name} - ${restError.rawError?.message}`);
        return null;
      }

      if (restError.status === 403) {
        Logger.error(`Missing permissions to create role: ${roleData.name}`);
        return null;
      }

      Logger.error(`Failed to create role ${roleData.name}`, error);
      return null;
    }
  }

  async createRolesSequentially(roles: RoleData[]): Promise<Map<string, string>> {
    const createdRoles = new Map<string, string>();
    const existingRoles = await this.fetchExistingRoles();

    let skipped = 0;
    for (const role of roles) {
      if (existingRoles.has(role.name)) {
        skipped++;
        createdRoles.set(role.name, existingRoles.get(role.name)!);
        continue;
      }

      Logger.info(`Creating role ${skipped + createdRoles.size + 1}/${roles.length}: ${role.name}`);
      const roleId = await this.createRole(role);
      if (roleId) {
        createdRoles.set(role.name, roleId);
        existingRoles.set(role.name, roleId);
      } else {
        Logger.warn(`Failed to create role: ${role.name}`);
      }

      await this.delay(REST_DELAY_MS);
    }

    Logger.info(`Role creation complete: ${createdRoles.size - skipped} new, ${skipped} skipped`);
    return createdRoles;
  }

  async fetchExistingRoles(): Promise<Map<string, string>> {
    try {
      const roles = await this.rest.get(
        Routes.guildRoles(this.guildId)
      ) as RESTGetAPIGuildRolesResult;

      const roleMap = new Map<string, string>();
      for (const role of roles) {
        roleMap.set(role.name, role.id);
      }
      Logger.info(`Fetched ${roleMap.size} existing roles`);
      return roleMap;
    } catch (error) {
      Logger.error('Failed to fetch existing roles', error);
      return new Map();
    }
  }

  async deleteRole(roleId: string): Promise<boolean> {
    try {
      await this.rest.delete(
        Routes.guildRole(this.guildId, roleId)
      );
      Logger.success(`Deleted role: ${roleId}`);
      return true;
    } catch (error: unknown) {
      const restError = error as { status?: number };
      if (restError.status === 429) {
        const retryAfter = 5000;
        Logger.warn(`Rate limited deleting role ${roleId}, waiting ${retryAfter}ms`);
        await this.delay(retryAfter);
        return await this.deleteRole(roleId);
      }
      Logger.error(`Failed to delete role ${roleId}`, error);
      return false;
    }
  }

  async deleteAllRoles(roleIds: string[]): Promise<number> {
    let deleted = 0;
    for (const roleId of roleIds) {
      if (await this.deleteRole(roleId)) {
        deleted++;
      }
      await this.delay(REST_DELAY_MS);
    }
    return deleted;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}