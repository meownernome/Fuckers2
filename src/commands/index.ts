import { AllCommand } from './AllCommand';
import { ChannelsCommand } from './ChannelsCommand';
import { CleanupCommand } from './CleanupCommand';
import { FAQCommand } from './FAQCommand';
import { IPCommand } from './IPCommand';
import { LeaderboardCommand } from './LeaderboardCommand';
import { PingCommand } from './PingCommand';
import { ProfileCommand } from './ProfileCommand';
import { RolesCommand } from './RolesCommand';
import { RulesCommand } from './RulesCommand';
import { SetupCommand } from './SetupCommand';
import { VerificationCommand } from './VerificationCommand';

export interface Command {
  execute(interaction: any): Promise<void>;
  command: { name: string; toJSON(): any };
}

const commandList: Command[] = [
  new AllCommand(),
  new ChannelsCommand(),
  new CleanupCommand(),
  new FAQCommand(),
  new IPCommand(),
  new LeaderboardCommand(),
  new PingCommand(),
  new ProfileCommand(),
  new RolesCommand(),
  new RulesCommand(),
  new SetupCommand(),
  new VerificationCommand(),
];

export function getAllCommands(): Command[] {
  return commandList;
}

export { AllCommand } from './AllCommand';
export { ChannelsCommand } from './ChannelsCommand';
export { CleanupCommand } from './CleanupCommand';
export { FAQCommand } from './FAQCommand';
export { IPCommand } from './IPCommand';
export { LeaderboardCommand } from './LeaderboardCommand';
export { PingCommand } from './PingCommand';
export { ProfileCommand } from './ProfileCommand';
export { RolesCommand } from './RolesCommand';
export { RulesCommand } from './RulesCommand';
export { SetupCommand } from './SetupCommand';
export { VerificationCommand } from './VerificationCommand';
