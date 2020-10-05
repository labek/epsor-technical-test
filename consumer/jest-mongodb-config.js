module.exports = {
    mongodbMemoryServerOptions: {
        binary: {
            version: '4.2.10',
            skipMD5: true,
        },
        instance: {
            dbName: 'test',
        },
        autoStart: false,
    },
};
