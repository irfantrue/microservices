export interface BaseErrorOptions {
    /** Machine-readable error code. e.g. "USER_NOT_FOUND" */
    code?: string
    /** HTTP status code. Defaults to 500. */
    statusCode?: number
    /** Arbitrary context data attached to this error. */
    context?: Record<string, unknown>
    /** Original cause (wraps native Error cause). */
    cause?: Error
}

export class BaseError extends Error {
    readonly code: string
    readonly statusCode: number
    readonly context: Record<string, unknown>
    override readonly cause?: Error

    constructor(message: string, options: BaseErrorOptions = {}) {
        super(message)

        // Fix prototype chain so `instanceof` works correctly
        // when transpiling to ES5 / CommonJS.
        Object.setPrototypeOf(this, new.target.prototype)

        this.name = new.target.name
        this.code = options.code ?? 'INTERNAL_ERROR'
        this.statusCode = options.statusCode ?? 500
        this.context = options.context ?? {}
        this.cause = options.cause

        // Maintain proper V8 stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, new.target)
        }
    }
}
