import { REST } from "@discordjs/rest";
import { Routes, SlashCommandBuilder } from "discord.js";

const claimCommand = new SlashCommandBuilder()
  .setName("claim")
  .setDescription("Claim your team room using this command.")
  .addIntegerOption((option) =>
    option
      .setName("team_number")
      .setDescription("The room you want to claim.")
      .setRequired(true)
  );
const unclaimCommand = new SlashCommandBuilder()
  .setName("unclaim")
  .setDescription("Unclaim your team room using this command.")
  .addStringOption((option) =>
    option
      .setName("team_number")
      .setDescription("The room you want to claim.")
      .setRequired(false)
  );
const whoamiCommand = new SlashCommandBuilder()
  .setName("whoami")
  .setDescription("Know who you are.");
const pingCommand = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

const testClaim = new SlashCommandBuilder()
  .setName("testclaim")
  .setDescription("Test claim command.");

// const deleteold = new SlashCommandBuilder()
//   .setName("deleteold")
//   .setDescription("Test claim command.");

const commands = [
  claimCommand,
  unclaimCommand,
  whoamiCommand,
  pingCommand,
  // testClaim,
  // deleteold,
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      {
        body: commands.map((command) => ({
          name: command.name,
          description: command.description,
          options: command.options,
          type: command.type,
        })),
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
