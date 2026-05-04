import { env } from '@config/env'
import { users } from '@db/schema/users'
import { db } from '@infrastructure/db'
import { logger } from '@shared/logger'

const log = logger.child({ module: 'App' })

log.debug('print env', { env })

// const newRole: NewRole = {
//     name: 'super_admin',
//     display: 'Super Administrator',
// }
//
// const resRole = await db.insert(roles).values(newRole).returning()
//
// const newPermission: NewPermission = {
//     name: '*:*',
//     resource: '*',
//     action: '*',
//     description: 'Full system access(super admin)',
//     category: 'system',
//     isActive: true,
// }
//
// const resPermission = await db.insert(permissions).values(newPermission).returning()
//
// const newUser: NewUser = {
//     name: 'Super Admin',
//     email: 'superadmin@example.com',
//     passwordHash: '$2a$12$TKh8H1.PfQx37YgCxDfOuCV34r5B1Y6VtbxWYXi9K2QpZ1D7E3mFO',
//     roleId: resRole[0]!.id,
//     isActive: true,
//     isVerified: false,
// }
//
// const resUser = await db.insert(users).values(newUser).returning()
//
// const newRolePermission: NewRolePermission = {
//     roleId: resRole[0]!.id,
//     permissionId: resPermission[0]!.id,
//     grantedBy: resUser[0]!.id,
//     isActive: true,
// }
//
// await db.insert(rolePermissions).values(newRolePermission)

const query = db.select().from(users).limit(10).prepare()

const listUsers = await query.execute()
console.log(listUsers)

const manyUsers = await db.query.roles.findMany({
    with: {
        rolePermissions: {
            where: {
                isActive: true,
            },
            with: {
                permissions: true,
            },
        },
    },
})
console.log(manyUsers)
