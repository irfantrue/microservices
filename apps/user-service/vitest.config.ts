import { resolve } from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: {
            '@config': resolve(__dirname, './config'),
            '@db': resolve(__dirname, './db'),
            '@shared': resolve(__dirname, './src/shared'),
            '@domain': resolve(__dirname, './src/domain'),
            '@use-case': resolve(__dirname, './src/use-case'),
            '@infrastructure': resolve(__dirname, './src/infrastructure'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['__test__/**/*.{test,spec}.ts'],
    },
})
