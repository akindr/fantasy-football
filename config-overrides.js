const { override } = require('customize-cra');
const fs = require('fs');
const path = require('path');

module.exports = override((config) => {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "https": require.resolve("https-browserify"),
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "http": require.resolve("stream-http"),
        "url": require.resolve("url/"),
        "zlib": require.resolve("browserify-zlib"),
        "assert": require.resolve("assert/"),
        "buffer": require.resolve("buffer/"),
        "querystring": require.resolve("querystring-es3"),
        "vm": require.resolve("vm-browserify")
    };

    config.plugins = [
        ...config.plugins,
        new (require('webpack')).ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ];

    // Configure HTTPS
    config.devServer = {
        ...config.devServer,
        https: {
            key: fs.readFileSync(path.resolve(__dirname, '.cert/localhost-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, '.cert/localhost.pem')),
        },
        host: 'localhost',
        port: 3000
    };

    return config;
}); 