const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      modules: [
        ...(options.resolve?.modules || ['node_modules']),
        path.resolve(__dirname, '../../node_modules'),
      ],
    },
  };
};
