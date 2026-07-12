import { MessageFlags,  SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export class FAQCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const faqs = [
      {
        question: 'How to verify your Minecraft account',
        answer: 'Use `/verify <minecraft_username>` to link your Discord account to your Minecraft account.'
      },
      {
        question: 'How to request a tier test',
        answer: 'Visit the #create-ticket channel and provide your requested PvP mode.'
      },
      {
        question: 'Retesting requests',
        answer: 'Request retesting using the #retest-request channel or ask your tester.'
      },
      {
        question: 'Appeals process',
        answer: 'Submit appeals in the #appeal channel with all relevant details.'
      },
      {
        question: 'Server IP',
        answer: 'The server IP is `play.harvalmc.fun`'
      },
      {
        question: 'Staff information',
        answer: 'Staff roles are displayed in the #staff channel. Important staff can be found on the staff list.'
      }
    ];

    let faqContent = '**Frequently Asked Questions:**\n\n';
    for (const faq of faqs) {
      faqContent += `**${faq.question}**\n${faq.answer}\n\n`;
    }

    await interaction.reply({ content: faqContent, ephemeral: true });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('faq')
      .setDescription('View frequently asked questions')
      .setDMPermission(false);
  }
}