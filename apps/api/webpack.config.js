const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
      modules: [
        ...(options.resolve?.modules || ['node_modules']),
        path.resolve(__dirname, '../../node_modules'),
      ],
    },
  };
};
