const path = require('path');
const nodeExternals = require('webpack-node-externals');

const p = (dir = '') => path.join(__dirname, dir);

module.exports = {
  entry: './source/index.js',
  target: 'node',
  output: {
    path: p(),
    filename: 'index.js',
    library: 'web-socker-server',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [
          p('source'),
          p('tests'),
        ],
        loader: 'babel-loader',
      },
    ],
  },
  externals: [nodeExternals()],
  devtool: 'source-map'
};