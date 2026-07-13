"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationCommand = exports.SetupCommand = exports.RulesCommand = exports.RolesCommand = exports.ProfileCommand = exports.PingCommand = exports.PermissionCommand = exports.MakeRolesCommand = exports.LeaderboardCommand = exports.IPCommand = exports.GtgCommand = exports.FAQCommand = exports.CleanupCommand = exports.ChannelsCommand = exports.AllCommand = void 0;
exports.getAllCommands = getAllCommands;
const AllCommand_1 = require("./AllCommand");
const ChannelsCommand_1 = require("./ChannelsCommand");
const CleanupCommand_1 = require("./CleanupCommand");
const FaqCommand_1 = require("./FaqCommand");
const GtgCommand_1 = require("./GtgCommand");
const IpCommand_1 = require("./IpCommand");
const LeaderboardCommand_1 = require("./LeaderboardCommand");
const MakeRolesCommand_1 = require("./MakeRolesCommand");
const PermissionCommand_1 = require("./PermissionCommand");
const PingCommand_1 = require("./PingCommand");
const ProfileCommand_1 = require("./ProfileCommand");
const RolesCommand_1 = require("./RolesCommand");
const RulesCommand_1 = require("./RulesCommand");
const SetupCommand_1 = require("./SetupCommand");
const VerificationCommand_1 = require("./VerificationCommand");
const commandList = [
    new AllCommand_1.AllCommand(),
    new ChannelsCommand_1.ChannelsCommand(),
    new CleanupCommand_1.CleanupCommand(),
    new FaqCommand_1.FAQCommand(),
    new GtgCommand_1.GtgCommand(),
    new IpCommand_1.IPCommand(),
    new LeaderboardCommand_1.LeaderboardCommand(),
    new MakeRolesCommand_1.MakeRolesCommand(),
    new MakeRolesCommand_1.MakeRolesCommand('makeroels'),
    new PermissionCommand_1.PermissionCommand(),
    new PingCommand_1.PingCommand(),
    new ProfileCommand_1.ProfileCommand(),
    new RolesCommand_1.RolesCommand(),
    new RulesCommand_1.RulesCommand(),
    new SetupCommand_1.SetupCommand(),
    new VerificationCommand_1.VerificationCommand(),
];
function getAllCommands() {
    return commandList;
}
var AllCommand_2 = require("./AllCommand");
Object.defineProperty(exports, "AllCommand", { enumerable: true, get: function () { return AllCommand_2.AllCommand; } });
var ChannelsCommand_2 = require("./ChannelsCommand");
Object.defineProperty(exports, "ChannelsCommand", { enumerable: true, get: function () { return ChannelsCommand_2.ChannelsCommand; } });
var CleanupCommand_2 = require("./CleanupCommand");
Object.defineProperty(exports, "CleanupCommand", { enumerable: true, get: function () { return CleanupCommand_2.CleanupCommand; } });
var FaqCommand_2 = require("./FaqCommand");
Object.defineProperty(exports, "FAQCommand", { enumerable: true, get: function () { return FaqCommand_2.FAQCommand; } });
var GtgCommand_2 = require("./GtgCommand");
Object.defineProperty(exports, "GtgCommand", { enumerable: true, get: function () { return GtgCommand_2.GtgCommand; } });
var IpCommand_2 = require("./IpCommand");
Object.defineProperty(exports, "IPCommand", { enumerable: true, get: function () { return IpCommand_2.IPCommand; } });
var LeaderboardCommand_2 = require("./LeaderboardCommand");
Object.defineProperty(exports, "LeaderboardCommand", { enumerable: true, get: function () { return LeaderboardCommand_2.LeaderboardCommand; } });
var MakeRolesCommand_2 = require("./MakeRolesCommand");
Object.defineProperty(exports, "MakeRolesCommand", { enumerable: true, get: function () { return MakeRolesCommand_2.MakeRolesCommand; } });
var PermissionCommand_2 = require("./PermissionCommand");
Object.defineProperty(exports, "PermissionCommand", { enumerable: true, get: function () { return PermissionCommand_2.PermissionCommand; } });
var PingCommand_2 = require("./PingCommand");
Object.defineProperty(exports, "PingCommand", { enumerable: true, get: function () { return PingCommand_2.PingCommand; } });
var ProfileCommand_2 = require("./ProfileCommand");
Object.defineProperty(exports, "ProfileCommand", { enumerable: true, get: function () { return ProfileCommand_2.ProfileCommand; } });
var RolesCommand_2 = require("./RolesCommand");
Object.defineProperty(exports, "RolesCommand", { enumerable: true, get: function () { return RolesCommand_2.RolesCommand; } });
var RulesCommand_2 = require("./RulesCommand");
Object.defineProperty(exports, "RulesCommand", { enumerable: true, get: function () { return RulesCommand_2.RulesCommand; } });
var SetupCommand_2 = require("./SetupCommand");
Object.defineProperty(exports, "SetupCommand", { enumerable: true, get: function () { return SetupCommand_2.SetupCommand; } });
var VerificationCommand_2 = require("./VerificationCommand");
Object.defineProperty(exports, "VerificationCommand", { enumerable: true, get: function () { return VerificationCommand_2.VerificationCommand; } });
