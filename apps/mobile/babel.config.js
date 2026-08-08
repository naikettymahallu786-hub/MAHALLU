module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@mahallu/shared-types": "./packages/shared-types/src/index.ts",
            "@mahallu/shared-config": "./packages/shared-config/src/index.ts",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
