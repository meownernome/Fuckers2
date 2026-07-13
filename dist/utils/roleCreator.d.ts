export interface RoleData {
    name: string;
    color: number;
    permissions?: string;
}
export declare class RoleCreator {
    private rest;
    private guildId;
    constructor(token: string, guildId: string);
    createRole(roleData: RoleData): Promise<string | null>;
    createRolesSequentially(roles: RoleData[]): Promise<Map<string, string>>;
    fetchExistingRoles(): Promise<Map<string, string>>;
    deleteRole(roleId: string): Promise<boolean>;
    deleteAllRoles(roleIds: string[]): Promise<number>;
    private delay;
}
//# sourceMappingURL=roleCreator.d.ts.map