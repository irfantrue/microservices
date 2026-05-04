import { BaseError, BaseErrorOptions } from '@shared/errors/BaseError'
import { Effect } from 'effect'
import * as jose from 'jose'

// Error Types

export class JWTError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('JWT operation failed', { ...options, code: 'JWT_ERROR', statusCode: 500 })
    }
}

export class JWTExpiredError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('Token has expired', { ...options, code: 'JWT_EXPIRED', statusCode: 401 })
    }
}

export class JWTInvalidError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('Invalid token', { ...options, code: 'JWT_INVALID', statusCode: 401 })
    }
}

export class JWTMissingError extends BaseError {
    constructor(options?: Omit<BaseErrorOptions, 'code' | 'statusCode'>) {
        super('Token is missing', { ...options, code: 'JWT_MISSING', statusCode: 401 })
    }
}

// Token Payload Types

export interface AccessTokenPayload {
    sub: string
    email?: string
    roles?: string[]
    type: 'access'
    iat?: number
    exp?: number
}

export interface RefreshTokenPayload {
    sub: string
    type: 'refresh'
    iat?: number
    exp?: number
}

export interface TokenPair {
    accessToken: string
    refreshToken: string
    expiresIn: number
}

// Algorithm & Configuration

export const ALGORITHM_HS256 = 'HS256' as const
export const ALGORITHM_RS256 = 'RS256' as const

export type Algorithm = typeof ALGORITHM_HS256 | typeof ALGORITHM_RS256

export interface JWTConfig {
    secret: string
    accessTokenExpiry: number // seconds
    refreshTokenExpiry: number // seconds
    issuer?: string
    audience?: string
}

export interface RSAKeyPair {
    publicKey: string
    privateKey: string
}

// JWT Class

export class JWT {
    private readonly config: JWTConfig
    private readonly encoder = new TextEncoder()

    constructor(config: JWTConfig) {
        this.config = config
    }

    // Key Utilities

    private importSecret(secret: string): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            'raw',
            this.encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify'],
        )
    }

    private importRSAPublicKey(key: string): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            'spki',
            this.encoder.encode(key),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['verify'],
        )
    }

    private importRSAPrivateKey(key: string): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            'pkcs8',
            this.encoder.encode(key),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['sign'],
        )
    }

    // Token Generation

    signAccessToken(
        payload: Omit<AccessTokenPayload, 'iat' | 'exp'>,
    ): Effect.Effect<string, JWTError> {
        return Effect.tryPromise({
            try: async () => {
                const secret = await this.importSecret(this.config.secret)
                const jwt = new jose.SignJWT(payload as jose.JWTPayload)
                    .setProtectedHeader({ alg: ALGORITHM_HS256 })
                    .setIssuedAt()
                    .setExpirationTime(`${this.config.accessTokenExpiry}s`)
                    .setIssuer(this.config.issuer ?? 'user-service')
                    .setAudience(this.config.audience ?? '*')
                    .sign(secret)
                return jwt
            },
            catch: error => new JWTError({ cause: error instanceof Error ? error : undefined }),
        })
    }

    signRefreshToken(userId: string): Effect.Effect<string, JWTError> {
        return Effect.tryPromise({
            try: async () => {
                const secret = await this.importSecret(this.config.secret)
                const jwt = new jose.SignJWT({ sub: userId, type: 'refresh' } as jose.JWTPayload)
                    .setProtectedHeader({ alg: ALGORITHM_HS256 })
                    .setIssuedAt()
                    .setExpirationTime(`${this.config.refreshTokenExpiry}s`)
                    .setIssuer(this.config.issuer ?? 'user-service')
                    .sign(secret)
                return jwt
            },
            catch: error => new JWTError({ cause: error instanceof Error ? error : undefined }),
        })
    }

    generateTokenPair(
        userId: string,
        payload?: Partial<Omit<AccessTokenPayload, 'sub' | 'iat' | 'exp'>>,
    ): Effect.Effect<TokenPair, JWTError> {
        return Effect.flatMap(
            this.signAccessToken({ sub: userId, type: 'access', ...payload }),
            accessToken =>
                Effect.map(this.signRefreshToken(userId), refreshToken => ({
                    accessToken,
                    refreshToken,
                    expiresIn: this.config.accessTokenExpiry,
                })),
        )
    }

    // Token Verification

    verifyAccessToken(
        token: string,
    ): Effect.Effect<AccessTokenPayload, JWTError | JWTExpiredError | JWTInvalidError> {
        return Effect.tryPromise({
            try: async () => {
                const secret = await this.importSecret(this.config.secret)
                const { payload } = await jose.jwtVerify(token, secret, {
                    issuer: this.config.issuer ?? 'user-service',
                    audience: this.config.audience ?? '*',
                })

                if (payload.exp && Date.now() / 1000 > payload.exp) {
                    throw new JWTExpiredError()
                }

                return {
                    sub: payload.sub as string,
                    email: payload.email as string | undefined,
                    roles: payload.roles as string[] | undefined,
                    type: (payload.type as AccessTokenPayload['type']) ?? 'access',
                    iat: payload.iat,
                    exp: payload.exp,
                }
            },
            catch: error => {
                if (error instanceof JWTExpiredError) return error
                if (error instanceof jose.errors.JWTExpired)
                    return new JWTExpiredError({ cause: error as Error })
                if (error instanceof jose.errors.JWTClaimValidationFailed)
                    return new JWTInvalidError({ cause: error as Error })
                if (error instanceof jose.errors.JWSInvalid)
                    return new JWTInvalidError({ cause: error as Error })
                return new JWTInvalidError({ cause: error instanceof Error ? error : undefined })
            },
        })
    }

    verifyRefreshToken(
        token: string,
    ): Effect.Effect<string, JWTError | JWTExpiredError | JWTInvalidError> {
        return Effect.tryPromise({
            try: async () => {
                const secret = await this.importSecret(this.config.secret)
                const { payload } = await jose.jwtVerify(token, secret, {
                    issuer: this.config.issuer ?? 'user-service',
                    audience: this.config.audience ?? '*',
                })

                if (payload.exp && Date.now() / 1000 > payload.exp) {
                    throw new JWTExpiredError()
                }

                if (payload.type !== 'refresh') {
                    throw new JWTInvalidError({
                        context: { expected: 'refresh', got: payload.type },
                    })
                }

                return payload.sub as string
            },
            catch: error => {
                if (error instanceof JWTExpiredError || error instanceof JWTInvalidError)
                    return error
                if (error instanceof jose.errors.JWTExpired)
                    return new JWTExpiredError({ cause: error as Error })
                if (error instanceof jose.errors.JWTClaimValidationFailed)
                    return new JWTInvalidError({ cause: error as Error })
                if (error instanceof jose.errors.JWSInvalid)
                    return new JWTInvalidError({ cause: error as Error })
                return new JWTInvalidError({ cause: error instanceof Error ? error : undefined })
            },
        })
    }

    // Token Decoding (without verification - for debugging)

    decode(
        token: string,
    ): Effect.Effect<AccessTokenPayload | RefreshTokenPayload, JWTInvalidError> {
        return Effect.try({
            try: () => {
                const decoded = jose.decodeJwt(token)
                if (!decoded.sub)
                    throw new JWTInvalidError({ context: { message: 'missing sub claim' } })
                return decoded as unknown as AccessTokenPayload | RefreshTokenPayload
            },
            catch: error =>
                new JWTInvalidError({ cause: error instanceof Error ? error : undefined }),
        })
    }

    // Helper Extractors

    extractTokenFromHeader(
        authHeader: string | undefined,
    ): Effect.Effect<string, JWTMissingError | JWTInvalidError> {
        return Effect.try({
            try: () => {
                if (!authHeader) throw new JWTMissingError()
                const parts = authHeader.split(' ')
                if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
                    throw new JWTInvalidError({
                        context: { message: 'invalid authorization header format' },
                    })
                }
                if (!parts[1]) throw new JWTInvalidError({ context: { message: 'missing token' } })
                return parts[1]
            },
            catch: error => {
                if (error instanceof JWTMissingError || error instanceof JWTInvalidError)
                    return error
                return new JWTInvalidError({ cause: error instanceof Error ? error : undefined })
            },
        })
    }
}

// RSA Key Pair Generator (for RS256)

export async function generateRSAKeyPair(): Promise<RSAKeyPair> {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
    )

    const publicKeyExported = await crypto.subtle.exportKey('spki', publicKey)
    const privateKeyExported = await crypto.subtle.exportKey('pkcs8', privateKey)

    return {
        publicKey: Buffer.from(publicKeyExported).toString('base64'),
        privateKey: Buffer.from(privateKeyExported).toString('base64'),
    }
}

// Default Factory

export function createJWT(config: JWTConfig): JWT {
    return new JWT(config)
}
