import { refreshTokens } from "../../db/postgres/schemas";
import { db } from "../../db/postgres/db.postgres";
import { and, eq } from "drizzle-orm";



async function revokeToken(token : string, reason: string = 'Manual revocation') {
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(refreshTokens.token, token));
  }


async function revokeAllUserTokens (userId : string, reason : string = "All token revocation"){
  await db.update(refreshTokens).set({
    isRevoked:true,
    revokedAt : new Date(),
    revokedReason: reason,
  }).where(
    and(
      eq(refreshTokens.userId, userId),
      eq(refreshTokens.isRevoked,false)
    )
  )
}

export {revokeToken, revokeAllUserTokens};
