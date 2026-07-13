import { Client, Guild, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder } from 'discord.js';
export interface CategoryConfig {
    name: string;
    channels: ChannelConfig[];
}
export interface ChannelConfig {
    name: string;
    type: ChannelType;
    topic?: string;
    permissionOverwrites?: PermissionOverwriteConfig[];
}
export interface PermissionOverwriteConfig {
    id: string;
    allow?: bigint[];
    deny?: bigint[];
    type: 'role' | 'member';
}
export declare const CATEGORIES: CategoryConfig[];
export declare class ServerSetup {
    static CATEGORIES: CategoryConfig[];
    private client;
    private guild;
    private roleCreator;
    private createdCategories;
    private createdChannels;
    private roleMap;
    constructor(client: Client, guild: Guild, token: string);
    createAllRoles(): Promise<Map<string, string>>;
    createAllCategoriesAndChannels(): Promise<void>;
    private createCategory;
    private createChannel;
    postAllPanels(): Promise<void>;
    private getChannel;
    private sendPanel;
    postWelcomePanel(): Promise<void>;
    postRulesPanel(): Promise<void>;
    postFaqPanel(): Promise<void>;
    postVerifyPanel(): Promise<void>;
    postTierTestPanel(): Promise<void>;
    postQueuePanel(): Promise<void>;
    postRolesPanel(): Promise<void>;
    postStaffPanel(): Promise<void>;
    static createVerifyModal(): ModalBuilder;
    static createTierTestModal(): ModalBuilder;
    static createTicketModal(): ModalBuilder;
    static createStaffApplyModal(): ModalBuilder;
    static createTesterApplyModal(): ModalBuilder;
    static createGiveTierModal(): ModalBuilder;
    static createTicketButtons(ticketType?: 'tier' | 'support'): ActionRowBuilder<ButtonBuilder>;
    static createTierResultEmbed(playerTag: string, mode: string, tier: string): EmbedBuilder;
}
//# sourceMappingURL=ServerSetup.d.ts.map