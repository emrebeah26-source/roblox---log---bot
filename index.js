require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GROUP_ID = process.env.GROUP_ID;
const API_KEY = process.env.ROBLOX_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

let previousMembers = {};

async function fetchMembers(cursor = "") {
  const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/users?limit=100&cursor=${cursor}`;
  const response = await axios.get(url, {
    headers: { "x-api-key": API_KEY }
  });
  return response.data;
}

async function checkChanges() {
  let members = {};
  let cursor = "";

  do {
    const data = await fetchMembers(cursor);
    data.data.forEach(user => {
      members[user.userId] = {
        rank: user.role.rank,
        name: user.user.username
      };
    });
    cursor = data.nextPageCursor;
  } while (cursor);

  const channel = await client.channels.fetch(CHANNEL_ID);

  // Rank değişimi
  for (let userId in members) {
    if (previousMembers[userId] &&
        previousMembers[userId].rank !== members[userId].rank) {

      const embed = new EmbedBuilder()
        .setTitle("🔄 Rank Değişimi")
        .setDescription(`**${members[userId].name}** kullanıcısının rankı değişti.`)
        .setColor(0x00AEFF)
        .setTimestamp();

      channel.send({ embeds: [embed] });
    }
  }

  // Kick / Exile
  for (let userId in previousMembers) {
    if (!members[userId]) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 Gruptan Çıkarıldı")
        .setDescription(`**${previousMembers[userId].name}** gruptan çıkarıldı.`)
        .setColor(0xFF0000)
        .setTimestamp();

      channel.send({ embeds: [embed] });
    }
  }

  previousMembers = members;
}

client.once("ready", () => {
  console.log("Bot aktif!");
  setInterval(checkChanges, 60000);
});

client.login(process.env.DISCORD_TOKEN);
