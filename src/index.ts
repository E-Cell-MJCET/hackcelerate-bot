import {
  Client,
  Collection,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionOverwrites,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Channel IDs
const welcomeChannelId = "1371888209260318820";
const rulesChannelId = "1366870670000132157";
const claimRoomChannelId = "1371890577913675796";

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
});

client.commands = new Collection();

client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

  const participantRole = "1371166887118901321";
  await member?.roles.add(participantRole);

  if (welcomeChannel && welcomeChannel.isTextBased()) {
    welcomeChannel.send(
      `👋 Welcome, ${member.user.username}! Checkout the <#${rulesChannelId}> and claim your room here <#${claimRoomChannelId}>`
    );
  } else {
    console.error("Welcome channel not found or is not a text channel");
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  switch (message.content) {
    case "!ping":
      const ping = `🏓 Latency is ${Date.now() - message.createdTimestamp}ms`;
      message.reply(ping);
      break;

    case "!status":
      const status = `
📊 Bot Status:
- Connected to ${client.guilds.cache.size} servers
- Ping: ${client.ws.ping}ms
- Uptime: ${Math.round(client.uptime ?? 0 / 1000)} seconds
      `;
      message.reply(status);
      break;
    case "!testwelcome":
      const welcomeChannelId = "1366867373788889190";
      const welcomeChannel =
        message.guild?.channels.cache.get(welcomeChannelId);
      const member = message.member;
      if (!member) return;
      if (welcomeChannel && welcomeChannel.isTextBased()) {
        welcomeChannel.send(
          `👋 Welcome, ${member.user.username}! Checkout the <#${rulesChannelId}> and claim your room here <#${claimRoomChannelId}>`
        );
      } else {
        console.error("Welcome channel not found or is not a text channel");
      }
      break;
  }
});

async function hasTeamRole(member: any) {
  return member.roles.cache.some((role: { name: string }) =>
    role.name.startsWith("Team-")
  );
}

// Interaction with slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  switch (commandName) {
    case "ping":
      await interaction.reply("🏓 Pong!");
      break;
    // Claim commands also collects a room ID from the user
    case "claim":
      const roomNumber = interaction.options.get("team_number");
      if (!roomNumber) {
        await interaction.reply("Please provide a room number!");
        return;
      }
      // Check if user already has a team
      if (await hasTeamRole(interaction.member)) {
        await interaction.reply({
          content:
            "You already have a team! Use /unclaim first to leave your current team.",
        });
        return;
      }
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.guild) {
        await interaction.editReply({
          content: "This command can only be used in a server.",
        });
        return;
      }
      try {
        // Create team role
        const teamRole = await interaction.guild.roles.create({
          name: `Team-${roomNumber.value}`,
          mentionable: true,
          reason: `Team role created for ${interaction.user.username}`,
        });

        // Assign role to user
        await interaction.member?.roles.add(teamRole.id);
        // Find or create "My Team" category
        let category = "1371815764482330704";

        // if (!category) {
        //   category = await interaction.guild?.channels.create({
        //     name: `My Team`,
        //     type: 4, // CategoryChannel
        //   });
        // }

        const channelPermissions = [
          {
            id: interaction.guild.id, // @everyone role
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.Connect,
            ],
          },
          {
            id: teamRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ];

        // Create private text channel
        // const textChannel = await interaction.guild?.channels.create({
        //   name: `team-${roomNumber.value}`,
        //   type: 0, // TextChannel
        //   parent: category,
        //   topic: `Team ${roomNumber.value} - Created for ${interaction.user.username}`,
        //   permissionOverwrites: channelPermissions,
        // });
        // console.log(
        //   `Created channels for Team ${roomNumber.value}: <#${textChannel?.id}>`
        // );

        // Create private voice channel

        const voiceChannel = await interaction.guild?.channels.cache.find(
          (c) => c.name === `Team ${roomNumber.value} VC` && c.type === 2
        );
        if (!voiceChannel) {
          const voiceChannel = await interaction.guild?.channels.create({
            name: `Team ${roomNumber.value} VC`,
            type: 2, // VoiceChannel
            parent: category,
            permissionOverwrites: channelPermissions,
          });

          await interaction.editReply({
            content:
              `Your team has been set up!\n` +
              // `Text Channel: <#${textChannel?.id}>\n` +
              `Voice Channel: 🔊 <#${voiceChannel?.id}>\n` +
              `Role: ${teamRole.name}`,
          });

          break;
        }

        // // Log to claim room channel
        // const claimRoomChannel =
        //   interaction.guild?.channels.cache.get(claimRoomChannelId);
        // if (claimRoomChannel?.isTextBased()) {
        //   claimRoomChannel.send(
        //     `🚪 ${interaction.user.username} has claimed Team ${roomNumber.value}\n` +
        //       `Created private channels: <#${textChannel?.id}> and 🔊 ${voiceChannel?.name}\n` +
        //       `Role created: ${teamRole.name}`
        //   );
        // }

        // const claimRoomChannel =
        //   interaction.guild?.channels.cache.get(claimRoomChannelId);
        // if (claimRoomChannel?.isTextBased()) {
        //   claimRoomChannel.send(
        //     `🚪 ${interaction.user.username} has claimed Team ${roomNumber.value}\n` +
        //       `Created private channels: <#${textChannel?.id}> and 🔊 ${voiceChannel?.name}\n` +
        //       `Role created: ${teamRole.name}`
        //   );
        // }

        await interaction.editReply({
          content:
            `Your team has been set up!\n` +
            // `Text Channel: <#${textChannel?.id}>\n` +
            `Voice Channel: 🔊 <#${voiceChannel?.id}>\n` +
            `Role: ${teamRole.name}`,
        });
      } catch (error) {
        await interaction.editReply({
          content: "There was an error setting up your team.",
        });
        console.error("Error creating team:", error);
      }
      break;
    case "whoami":
      await interaction.editReply(
        `This command was run by ${interaction.user.username}, who joined on ${interaction.member?.joinedAt}.`
      );
      break;

    case "unclaim":
      if (!interaction.guild) {
        await interaction.reply({
          content: "This command can only be used in a server.",
        });
        return;
      }
      await interaction.deferReply({ ephemeral: true });

      try {
        const teamRole = interaction.member?.roles.cache.find((role) =>
          role.name.startsWith("Team-")
        );

        if (!teamRole) {
          await interaction.editReply({
            content: "You don't have any team to unclaim!",
          });
          return;
        }

        // Remove role from user and delete it
        await interaction.member?.roles.remove(teamRole);

        await interaction.editReply({
          content: `Successfully unclaimed ${teamRole.name}.`,
        });
      } catch (error) {
        console.error("Error unclaiming team:", error);
        await interaction.editReply({
          content: "There was an error unclaiming your team.",
        });
      }
      break;

    // case "testclaim":
    //   if (!interaction.guild) {
    //     await interaction.reply({
    //       content: "This command can only be used in a server.",
    //     });
    //     return;
    //   }
    //   try {
    //     for (let i = 158; i < 501; i++) {
    //       console.log("Creating team role:", i);
    //       const roomNumber = i;
    //       const teamRole = await interaction.guild.roles.create({
    //         name: `Team-${roomNumber}`,
    //         mentionable: true,
    //         reason: `Team role created for ${interaction.user.username}`,
    //       });

    //       // Assign role to user
    //       await interaction.member?.roles.add(teamRole.id);
    //       // Find or create "My Team" category
    //       let category = interaction.guild?.channels.cache.find(
    //         (c) => c.name === `Team-${roomNumber}` && c.type === 4
    //       );

    //       if (!category) {
    //         category = await interaction.guild?.channels.create({
    //           name: `Team-${roomNumber}`,
    //           type: 4, // CategoryChannel
    //         });
    //       }
    //       const channelPermissions = [
    //         {
    //           id: interaction.guild.id, // @everyone role
    //           deny: [
    //             PermissionFlagsBits.ViewChannel,
    //             PermissionFlagsBits.SendMessages,
    //             PermissionFlagsBits.Connect,
    //           ],
    //         },
    //         {
    //           id: teamRole.id,
    //           allow: [
    //             PermissionFlagsBits.ViewChannel,
    //             PermissionFlagsBits.SendMessages,
    //             PermissionFlagsBits.Connect,
    //             PermissionFlagsBits.AddReactions,
    //             PermissionFlagsBits.AttachFiles,
    //           ],
    //         },
    //       ];

    //       // Create private text channel
    //       const textChannel = await interaction.guild?.channels.create({
    //         name: `team-${roomNumber}`,
    //         type: 0, // TextChannel
    //         parent: category?.id,
    //         topic: `Team ${roomNumber} - Created for ${interaction.user.username}`,
    //         permissionOverwrites: channelPermissions,
    //       });

    //       // Create private voice channel
    //       const voiceChannel = await interaction.guild?.channels.create({
    //         name: `Team ${roomNumber} VC`,
    //         type: 2, // VoiceChannel
    //         parent: category?.id,
    //         permissionOverwrites: channelPermissions,
    //       });

    //       console.log(
    //         `Created channels for Team ${roomNumber}: <#${textChannel?.id}> and 🔊 ${voiceChannel?.name}`
    //       );

    //       console.log("Deleting team role:", teamRole.name);

    //       const teamRole_ = interaction.member?.roles.cache.find((role) =>
    //         role.name.startsWith("Team-")
    //       );

    //       // Remove role from user and delete it
    //       await interaction.member?.roles.remove(teamRole_);

    //       console.log("Deleted team role:", teamRole_.name);
    //     }
    //     await interaction.reply({
    //       content: `Test is successful!`,
    //     });
    //   } catch (error) {
    //     console.error("Error unclaiming team:", error);
    //     await interaction.reply({
    //       content: "There was an error unclaiming your team.",
    //     });
    //   }
    //   break;

    case "deleteold":
      await interaction.deferReply({ ephemeral: true });
      const teamRole_ = interaction.member?.roles.cache.find((role) =>
        role.name.startsWith("Team-")
      );

      if (teamRole_) {
        await interaction.member?.roles.remove(teamRole_);
        console.log("Deleted team role:", teamRole_.name);
      }

      // Remove all voice channels that start with "Team-" and text channes that start with "team-" and categories that start with "Team-"
      const channelsToDelete = interaction.guild?.channels.cache.filter(
        (channel) =>
          channel.name.startsWith("Team") &&
          (channel.type === 0 || channel.type === 2 || channel.type === 4)
      );
      if (channelsToDelete) {
        channelsToDelete.forEach(async (channel) => {
          await channel.delete();
          console.log("Deleted channel:", channel.name);
        });
      }
      // Remove all roles that start with "Team-"
      const rolesToDelete = interaction.guild?.roles.cache.filter((role) =>
        role.name.startsWith("Team-")
      );
      if (rolesToDelete) {
        rolesToDelete.forEach(async (role) => {
          await role.delete();
          console.log("Deleted role:", role.name);
        });
      }
      // Remove all categories that start with "Team-"
      const categoriesToDelete = interaction.guild?.channels.cache.filter(
        (channel) => channel.name.startsWith("Team-") && channel.type === 4
      );
      if (categoriesToDelete) {
        categoriesToDelete.forEach(async (category) => {
          await category.delete();
          console.log("Deleted category:", category.name);
        });
      }
      await interaction.editReply({
        content: "Old team roles and channels have been deleted.",
      });
      break;

    default:
      await interaction.reply("Unknown command.");
  }
});

client
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("🤖 Bot is online!");
  })
  .catch((error) => {
    console.error("Error logging in:", error);
  });
