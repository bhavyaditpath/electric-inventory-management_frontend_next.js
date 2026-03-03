import rawEmojiMartData from "@emoji-mart/data";

type EmojiMartData = {
  aliases?: Record<string, string>;
  emojis?: Record<string, unknown>;
};

const SEARCH_ALIAS_OVERRIDES: Record<string, string> = {
  happy: "smiley",
  happiness: "smile",
  joyful: "grin",
  cheerful: "smiley",
  pleased: "blush",
  glad: "slightly_smiling_face",
  smileyface: "smiley",
};

const withSearchAliasOverrides = (data: EmojiMartData): EmojiMartData => {
  const aliases = { ...(data.aliases || {}) };
  const emojiMap = data.emojis || {};

  Object.entries(SEARCH_ALIAS_OVERRIDES).forEach(([keyword, targetId]) => {
    if (emojiMap[targetId]) {
      aliases[keyword] = targetId;
    }
  });

  return {
    ...data,
    aliases,
  };
};

export const emojiMartData = withSearchAliasOverrides(rawEmojiMartData as EmojiMartData);

