const path = require('path');
const webpack = require('webpack');

const SpawnServerPlugin = require('spawn-server-webpack-plugin');

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';
const isDev = !isProd;
const spawnedServer = isDev && new SpawnServerPlugin();

module.exports = [
  compiler({
    name: 'Server',
    target: 'async-node',
    devtool: isProd ? false : 'inline-source-map',
    externals: [/^[^./!]/], // excludes node_modules
    optimization: {
      usedExports: true,
      minimize: false,
    },
    devServer: isDev
      ? {
          overlay: true,
          stats: 'minimal',
          contentBase: false,
          compress: true,
          port: 9009,
          ...spawnedServer.devServerConfig,
        }
      : undefined,
    plugins: [
      new webpack.DefinePlugin({
        'process.browser': undefined,
        'process.env.BUNDLE': true,
      }),
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: true,
      }),
      isDev && spawnedServer,
    ],
  }),
];

function compiler(config) {
  return {
    ...config,
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'inline-source-map',
    output: {
      libraryTarget: 'commonjs2',
      ...config.output,
    },
    resolve: {
      extensions: ['.js'],
    },
    plugins: [
      ...config.plugins,
    ].filter(Boolean),
  };
}
