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

const converters = {
  cjp: [require("cjp").generate],
  mhr: [require("genhera").generate],
  nml: [require("nomlish").translate],
  grj: [
    async (text, languages) => {
      const response = await axios.get(
        process.env.RETRANSLATE_API_URL +
          "?text=" +
          encodeURIComponent(text) +
          (languages === undefined ? "" : "&languages=" + languages)
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
              ggt: () => [options.getInteger("languages")],
            }[commandName]?.(),
          },
        ],
      });
      if (converted.result[0].status !== "success")
        throw converted.result[0].error;
      await interaction.editReply(converted.text);
    } else if (commandName === "5000") {
      let url =
        "https://gsapi.cyberrex.jp/image?top=" +
        encodeURIComponent(options.getString("top"));
      url +=
        "&bottom=" +
        encodeURIComponent(options.getString("bottom") ?? "欲しい！");
      if (options.getBoolean("noalpha")) url += "&noalpha=true";
      if (options.getBoolean("rainbow")) url += "&rainbow=true";
      await interaction.editReply({
        files: [{ attachment: url, name: encodeURIComponent(url) + ".png" }],
      });
    } else if (commandName === "chain") {
      const steps = (
        options.getString("steps") ?? "nml,nml,nml,grj,mhr,cjp"
      ).split(",");
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
          description: "デフォルト:nml,nml,nml,grj,mhr,cjp",
          required: false,
        },
      ],
    },
  ];
  await Promise.all(
    process.env.DISCORD_GUILDS.split(",").map((guild_id) =>
      client.application.commands.set(data, guild_id)
    )
  );
  console.log("Ready!");
});

client.login(process.env.DISCORD_TOKEN);
