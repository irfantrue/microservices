import { BaseError, BaseErrorOptions } from '@shared/errors/BaseError'
import { Effect } from 'effect'

const ARGON2_OPTIONS = {
    algorithm: 'argon2id' as const,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 4,
}

export class HashError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('Failed to hash password', { ...options, code: 'HASH_ERROR', statusCode: 500 })
    }
}

export class VerifyError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('Failed to verify password', { ...options, code: 'VERIFY_ERROR', statusCode: 500 })
    }
}

export class InvalidCredentialsError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('Invalid credentials', { ...options, code: 'INVALID_CREDENTIALS', statusCode: 500 })
    }
}

export class ArgonHash {
    private readonly options = ARGON2_OPTIONS

    hash(plainText: string): Effect.Effect<string, HashError> {
        return Effect.tryPromise({
            try: () => Bun.password.hash(plainText, this.options),
            catch: error => new HashError({ cause: error instanceof Error ? error : undefined }),
        })
    }

    verify(plainText: string, hash: string): Effect.Effect<boolean, VerifyError> {
        return Effect.tryPromise({
            try: async () => {
                if (!hash.startsWith('$argon2')) return false
                return Bun.password.verify(plainText, hash)
            },
            catch: error => new VerifyError({ cause: error instanceof Error ? error : undefined }),
        })
    }
}
