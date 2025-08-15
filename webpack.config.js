// @ts-check
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: path.resolve(__dirname, 'src', 'web', 'index.ts'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist', 'web'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'web', 'index.html'),
      filename: 'index.html',
      scriptLoading: 'defer',
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist', 'web'),
    },
    port: 5173,
    open: true,
  },
};
