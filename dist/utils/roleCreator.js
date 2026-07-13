"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleCreator = void 0;
const discord_js_1 = require("discord.js");
const Logger_js_1 = require("../utils/Logger.js");
const REST_DELAY_MS = 1200;
class RoleCreator {
    rest;
    guildId;
    constructor(token, guildId) {
        this.rest = new discord_js_1.REST({ version: '10' }).setToken(token);
        this.guildId = guildId;
    }
    async createRole(roleData) {
        try {
            const body = {
                name: roleData.name,
                color: roleData.color,
                permissions: roleData.permissions || '0',
                mentionable: false,
                hoist: false,
            };
            const role = await this.rest.post(discord_js_1.Routes.guildRoles(this.guildId), { body });
            Logger_js_1.Logger.success(`Created role: ${roleData.name} (${role.id})`);
            return role.id;
        }
        catch (error) {
            const restError = error;
            if (restError.status === 429) {
                const retryAfter = (restError.rawError?.retry_after ?? 5) * 1000;
                Logger_js_1.Logger.warn(`Rate limited on ${roleData.name}, waiting ${retryAfter}ms`);
                await this.delay(retryAfter);
                return await this.createRole(roleData);
            }
            if (restError.status === 400 && restError.rawError?.code === 50035) {
                Logger_js_1.Logger.warn(`Role name invalid: ${roleData.name} - ${restError.rawError?.message}`);
                return null;
            }
            if (restError.status === 403) {
                Logger_js_1.Logger.error(`Missing permissions to create role: ${roleData.name}`);
                return null;
            }
            Logger_js_1.Logger.error(`Failed to create role ${roleData.name}`, error);
            return null;
        }
    }
    async createRolesSequentially(roles) {
        const createdRoles = new Map();
        const existingRoles = await this.fetchExistingRoles();
        let skipped = 0;
        for (const role of roles) {
            if (existingRoles.has(role.name)) {
                skipped++;
                createdRoles.set(role.name, existingRoles.get(role.name));
                continue;
            }
            Logger_js_1.Logger.info(`Creating role ${skipped + createdRoles.size + 1}/${roles.length}: ${role.name}`);
            const roleId = await this.createRole(role);
            if (roleId) {
                createdRoles.set(role.name, roleId);
                existingRoles.set(role.name, roleId);
            }
            else {
                Logger_js_1.Logger.warn(`Failed to create role: ${role.name}`);
            }
            await this.delay(REST_DELAY_MS);
        }
        Logger_js_1.Logger.info(`Role creation complete: ${createdRoles.size - skipped} new, ${skipped} skipped`);
        return createdRoles;
    }
    async fetchExistingRoles() {
        try {
            const roles = await this.rest.get(discord_js_1.Routes.guildRoles(this.guildId));
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
        try {
            await this.rest.delete(discord_js_1.Routes.guildRole(this.guildId, roleId));
            Logger_js_1.Logger.success(`Deleted role: ${roleId}`);
            return true;
        }
        catch (error) {
            const restError = error;
            if (restError.status === 429) {
                const retryAfter = 5000;
                Logger_js_1.Logger.warn(`Rate limited deleting role ${roleId}, waiting ${retryAfter}ms`);
                await this.delay(retryAfter);
                return await this.deleteRole(roleId);
            }
            Logger_js_1.Logger.error(`Failed to delete role ${roleId}`, error);
            return false;
        }
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