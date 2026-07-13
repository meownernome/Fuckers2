"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleCreator = void 0;
const discord_js_1 = require("discord.js");
const Logger_js_1 = require("../utils/Logger.js");
const REST_DELAY_MS = 1200;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 20000;
class RoleCreator {
    rest;
    guildId;
    constructor(token, guildId) {
        this.rest = new discord_js_1.REST({ version: '10' }).setToken(token);
        this.guildId = guildId;
    }
    async createRole(roleData) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            try {
                const body = {
                    name: roleData.name,
                    color: roleData.color,
                    permissions: roleData.permissions || '0',
                    mentionable: false,
                    hoist: false,
                };
                const role = await this.rest.post(discord_js_1.Routes.guildRoles(this.guildId), { body, signal: controller.signal });
                clearTimeout(timeoutId);
                Logger_js_1.Logger.success(`Created role: ${roleData.name} (${role.id})`);
                return role.id;
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof Error && error.name === 'AbortError') {
                    Logger_js_1.Logger.error(`Role creation timeout for ${roleData.name}`, error);
                    if (attempt < MAX_RETRIES) {
                        await this.delay(REST_DELAY_MS * 2);
                        continue;
                    }
                    return null;
                }
                const restError = error;
                if (restError.status === 429) {
                    const retryAfter = restError.rawError?.retry_after ?? REST_DELAY_MS;
                    Logger_js_1.Logger.rateLimit(`Rate limited creating ${roleData.name}`, retryAfter);
                    await this.delay(retryAfter);
                    continue;
                }
                if (restError.status === 400 && restError.rawError?.code === 50035) {
                    Logger_js_1.Logger.warn(`Role name invalid: ${roleData.name}`);
                    return null;
                }
                if (restError.status === 403) {
                    Logger_js_1.Logger.error(`Missing permissions to create role: ${roleData.name}`, error);
                    return null;
                }
                Logger_js_1.Logger.error(`Failed to create role ${roleData.name} (attempt ${attempt}/${MAX_RETRIES})`, error);
                if (attempt < MAX_RETRIES) {
                    await this.delay(REST_DELAY_MS);
                }
            }
        }
        return null;
    }
    async createRolesSequentially(roles) {
        const createdRoles = new Map();
        const existingRoles = await this.fetchExistingRoles();
        for (const role of roles) {
            if (existingRoles.has(role.name)) {
                Logger_js_1.Logger.debug(`Role already exists: ${role.name}`);
                createdRoles.set(role.name, existingRoles.get(role.name));
                continue;
            }
            const roleId = await this.createRole(role);
            if (roleId) {
                createdRoles.set(role.name, roleId);
                existingRoles.set(role.name, roleId);
            }
            await this.delay(REST_DELAY_MS);
        }
        return createdRoles;
    }
    async fetchExistingRoles() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            const roles = await this.rest.get(discord_js_1.Routes.guildRoles(this.guildId), { signal: controller.signal });
            clearTimeout(timeoutId);
            const roleMap = new Map();
            for (const role of roles) {
                roleMap.set(role.name, role.id);
            }
            Logger_js_1.Logger.info(`Fetched ${roleMap.size} existing roles`);
            return roleMap;
        }
        catch (error) {
            Logger_js_1.Logger.error('Failed to fetch existing roles', error);
            return new Map();
        }
    }
    async deleteRole(roleId) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            try {
                await this.rest.delete(discord_js_1.Routes.guildRole(this.guildId, roleId), { signal: controller.signal });
                clearTimeout(timeoutId);
                Logger_js_1.Logger.success(`Deleted role: ${roleId}`);
                return true;
            }
            catch (error) {
                clearTimeout(timeoutId);
                const restError = error;
                if (restError.status === 429) {
                    const retryAfter = restError.rawError?.retry_after ?? REST_DELAY_MS;
                    Logger_js_1.Logger.rateLimit(`Rate limited deleting role ${roleId}`, retryAfter);
                    await this.delay(retryAfter);
                    continue;
                }
                Logger_js_1.Logger.error(`Failed to delete role ${roleId} (attempt ${attempt}/${MAX_RETRIES})`, error);
                if (attempt < MAX_RETRIES) {
                    await this.delay(REST_DELAY_MS);
                }
            }
        }
        return false;
    }
    async deleteAllRoles(roleIds) {
        let deleted = 0;
        for (const roleId of roleIds) {
            if (await this.deleteRole(roleId)) {
                deleted++;
            }
            await this.delay(REST_DELAY_MS);
        }
        return deleted;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RoleCreator = RoleCreator;
//# sourceMappingURL=roleCreator.js.map