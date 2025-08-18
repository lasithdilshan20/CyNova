// @ts-check
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
let CompressionPlugin;
try { CompressionPlugin = require('compression-webpack-plugin'); } catch {}
let MiniCssExtractPlugin;
let CssMinimizerPlugin;
let haveCssLoaders = false;
try {
  MiniCssExtractPlugin = require('mini-css-extract-plugin');
  CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
  // probe loaders (optional in envs without CSS toolchain installed)
  require.resolve('css-loader');
  require.resolve('postcss-loader');
  haveCssLoaders = true;
} catch {}

/**
 * @param {any} env
 * @param {{ mode?: 'development'|'production'|'none' }} argv
 * @returns {import('webpack').Configuration}
 */
module.exports = (env, argv) => {
  const isProd = argv && argv.mode === 'production';

  /** @type {import('webpack').RuleSetRule[]} */
  const rules = [
    {
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
  ];

  if (haveCssLoaders && MiniCssExtractPlugin) {
    rules.push({
      test: /\.css$/i,
      use: [
        MiniCssExtractPlugin.loader,
        { loader: 'css-loader', options: { sourceMap: !isProd } },
        { loader: 'postcss-loader', options: { sourceMap: !isProd } },
      ],
    });
  } else {
    // Fallback: allow importing CSS as raw source so builds don't fail without loaders
    rules.push({ test: /\.css$/i, type: 'asset/source' });
  }

  /** @type {import('webpack').Configuration} */
  const config = {
    entry: {
      app: path.resolve(__dirname, 'src', 'web', 'index.ts'),
      enhance: path.resolve(__dirname, 'src', 'web', 'enhance.js'),
    },
    output: {
      filename: 'js/[name].[contenthash].js',
      chunkFilename: 'js/[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist', 'web'),
      clean: true,
      assetModuleFilename: 'assets/[hash][ext][query]',
    },
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: { rules },
    optimization: {
      splitChunks: { chunks: 'all' },
      runtimeChunk: 'single',
      minimize: isProd,
      minimizer: CssMinimizerPlugin ? ['...', new CssMinimizerPlugin()] : ['...'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src', 'web', 'index.html'),
        filename: 'index.html',
        scriptLoading: 'defer',
        chunks: ['app'],
      }),
      ...(MiniCssExtractPlugin ? [new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash].css' })] : []),
      ...(CompressionPlugin ? [
        new CompressionPlugin({ test: /\.(js|css|html|svg)$/i, algorithm: 'gzip' }),
        new CompressionPlugin({ filename: '[path][base].br', algorithm: 'brotliCompress', test: /\.(js|css|html|svg)$/i, compressionOptions: { level: 11 }, threshold: 10240, minRatio: 0.8 })
      ] : []),
    ],
    devServer: {
      static: { directory: path.resolve(__dirname, 'dist', 'web') },
      hot: true,
      client: { overlay: true },
      port: 5173,
      open: true,
    },
  };

  return config;
};
