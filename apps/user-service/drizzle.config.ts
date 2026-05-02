import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './db/schema/**/*.ts',
    out: './db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env.POSTGRES_HOST!,
        user: process.env.POSTGRES_USER!,
        password: process.env.POSTGRES_PASS!,
        database: process.env.POSTGRES_DB!,
    },
    migrations: {
        table: 'journal',
        schema: 'drizzle',
    },
    schemaFilter: 'auth',
    verbose: true,
    strict: true,
})
