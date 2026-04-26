export interface ITemplateEngine {
    compile(slug: string, vars: Record<string, string>): Promise<string>
}
