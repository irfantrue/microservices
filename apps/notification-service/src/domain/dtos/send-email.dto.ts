import { z } from 'zod'

export const SendEmailJobSchema = z.object({
    recipientId: z.uuidv7(),
    to: z.email(),
    templateSlug: z.string().min(1),
    vars: z.record(z.string(), z.string()).default({}),
})

export type SendEmailJobDto = z.infer<typeof SendEmailJobSchema>
