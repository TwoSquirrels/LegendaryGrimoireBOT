// SPDX-License-Identifier: MIT

/*
 * Require Environments
 * - DISCORD_TOKEN
 * - RETRANSLATE_API_URL (GAS for /gas/main.js)
 * - DISCORD_GUILDS (separate ",")
 */

const dotenv = require("dotenv");
const axios = require("axios").default;
const { Client, Intents } = require("discord.js");
const Converter = require("submarin-converter-core").SC;

dotenv.config();

if (process.env.REPLIT_ENVIRONMENT === "production") {
  const express = require("express");
  const server = express();
  server.get("/", (_req, res) => res.send("<h1>伝説の魔導書 is working!</h1>"));
  server.listen(3000, () => console.log("Ready to server!"));
}

const converters = {
  cjp: [require("cjp").generate],
  mhr: [require("genhera").generate],
  nml: [
    async (text, level) => {
      level ??= 2;
      const response = await axios({
        method: "post",
        url: "https://www.nomlish.tk/api/translate",
        data: {
          text,
          level,
        },
      });
      if (response.data.status !== 0) throw "translation is not possible";
      return response.data.result;
    },
  ],
  grj: [
    async (text, languages) => {
      languages ??= 10;
      const response = await axios.get(
        process.env.RETRANSLATE_API_URL +
          "?text=" +
          encodeURIComponent(text) +
          "&languages=" +
          languages
      );
      if (response.data.status !== "success") throw response.data.error.message;
      return response.data.data.text;
    },
  ],
};
const converter = new Converter({ converter: converters });

const client = new Client({ intents: Object.values(Intents.FLAGS) });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  await interaction.deferReply();
  try {
    const { commandName, options } = interaction;
    if (Object.keys(converters).includes(commandName)) {
      const converted = await converter.convert({
        text: options.getString("input"),
        converter: [
          {
            name: commandName,
            option: {
              nml: () => [options.getInteger("level")],
              grj: () => [options.getInteger("languages")],
            }[commandName]?.(),
          },
        ],
      });
      if (converted.result[0].status !== "success")
        throw converted.result[0].error;
      await interaction.editReply(converted.text);
    } else if (commandName === "5000") {
      let url =
        "https://gsapi.cbrx.io/image?top=" +
        encodeURIComponent(options.getString("top"));
      url +=
        "&bottom=" +
        encodeURIComponent(options.getString("bottom") ?? "欲しい！");
      if (options.getBoolean("noalpha")) url += "&noalpha=true";
      if (options.getBoolean("rainbow")) url += "&rainbow=true";
      await interaction.editReply(url);
    } else if (commandName === "chain") {
      const steps = (
        options.getString("steps") ?? "nml,nml,nml,grj,mhr,cjp"
      ).split(",");
      if (steps.length > 16) throw new Error("最長は 16 連です。");
      for (const step of steps)
        if (!Object.keys(converters).includes(step))
          throw new Error(`${step} というコンバータはありません。`);
      const converted = await converter.convert({
        text: options.getString("input"),
        converter: steps.map((step) => ({ name: step })),
      });
      await interaction.editReply(converted.text);
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply(`An error occurred.\`\`\`js\n${error}\n\`\`\``);
  }
});

client.once("ready", async () => {
  const input = (description = "入力") => ({
    type: "STRING",
    name: "input",
    description,
    required: true,
  });
  const data = [
    {
      name: "cjp",
      description: "怪レい日本语",
      options: [input()],
    },
    {
      name: "mhr",
      description: "ﾒﾝﾍﾗ文章",
      options: [input()],
    },
    {
      name: "nml",
      description: "ノマリッシュ",
      options: [
        input("イン・トゥ・ザ・ブレインズ"),
        {
          type: "INTEGER",
          name: "level",
          description: "威力（レベル）。デフォルティスは～第二幕～",
          required: false,
          choices: new Array(5)
            .fill()
            .map((_v, i) => ({ name: `${1 + i}`, value: 1 + i })),
        },
      ],
    },
    {
      name: "grj",
      description: "Google再翻訳",
      options: [
        input(),
        {
          type: "INTEGER",
          name: "languages",
          description: "経由する言語の数 (1~64)",
          required: false,
        },
      ],
    },
    {
      name: "5000",
      description: "5000兆円欲しい！",
      options: [
        {
          type: "STRING",
          name: "top",
          description: "上部文字列",
          required: true,
        },
        {
          type: "STRING",
          name: "bottom",
          description: "下部文字列",
          required: false,
        },
        {
          type: "BOOLEAN",
          name: "noalpha",
          description: "背景色を白にする",
          required: false,
        },
        {
          type: "BOOLEAN",
          name: "rainbow",
          description: "虹色にする",
          required: false,
        },
      ],
    },
    {
      name: "chain",
      description: "つなげる (エラーは無視,それぞれの設定はデフォルト)",
      options: [
        input(),
        {
          type: "STRING",
          name: "steps",
          description: "16連まで,デフォルト:nml,nml,nml,grj,mhr,cjp",
          required: false,
        },
      ],
    },
  ];
  await Promise.all(
    process.env.DISCORD_GUILDS.split(",").map((guild_id) =>
      client.application.commands
        .set(data, guild_id)
        .catch((error) => console.error(error))
    )
  );
  console.log("Ready to BOT!");
});

client.login(process.env.DISCORD_TOKEN);
