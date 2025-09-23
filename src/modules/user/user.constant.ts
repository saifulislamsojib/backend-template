export const userRoles = ['user', 'admin', 'super-admin'] as const;

export type Role = (typeof userRoles)[number];
