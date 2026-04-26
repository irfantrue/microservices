import fsync from 'node:fs'
import path from 'node:path'

import Handlebars from 'handlebars'

import type { ITemplateEngine } from '@/domain/interface/ITemplateEngine'

export class HandlebarsAdapter implements ITemplateEngine {
    // Cache compiled templates in memory
    private readonly cache = new Map<string, HandlebarsTemplateDelegate>()

    private load(slug: string): HandlebarsTemplateDelegate {
        if (this.cache.has(slug)) return this.cache.get(slug)!

        const filepath = path.resolve('templates', `${slug}.hbs`)
        const source = fsync.readFileSync(filepath, 'utf-8')
        const compiled = Handlebars.compile(source)

        this.cache.set(slug, compiled)
        return compiled
    }

    async compile(slug: string, vars: Record<string, string>): Promise<string> {
        const template = this.load(slug)
        return template(vars)
    }
}
