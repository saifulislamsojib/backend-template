import type { PublicUser } from "@/modules/user/user.types";

type JWTDecoded = { exp?: number; iat?: number };

export type JWTPayload = Pick<PublicUser, "email" | "_id" | "role">;
export type AuthPayload = Omit<JWTPayload, "_id"> & JWTDecoded & { _id: string };
export type AuthUser = PublicUser & JWTDecoded;
