var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [{
      test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
    ],
  },
};
/*
  function(node_env) {
  var config = ;

  if (node_env === 'production') {
    return Object.assign(config, {
      watch: false,
      plugins: 

,
    });
  }
  return config;
};
*/
