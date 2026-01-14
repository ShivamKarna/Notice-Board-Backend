import type {Request, Response, NextFunction} from "express";
import {createGuestSession,getSessionByToken, convertGuestToUserSession} from "../utils/auth/session.ts"
import { ApiError } from "../utils/ApiError.ts";
import { STATUS_CODE } from "../types/httpStatus";
import type { NetStream } from "ioredis/built/types";


const ensureGuestSession = async (req : Request, res : Response, next : NextFunction)=>{
  try {
    let sessionToken = req.cookies.session_token;

    if(!sessionToken){
      const guestSession = await createGuestSession();
      sessionToken = guestSession?.sessionToken;

      res.cookie('session_token',sessionToken,{
        httpOnly: true,
        secure : process.env.NODE_ENV === 'production',
        sameSite : 'lax',
        maxAge : 7 * 24 * 60 * 60 * 1000,
      });
    }else{
      const session = await getSessionByToken(sessionToken);

      if(!session){
        const guestSession = await createGuestSession();
        sessionToken = guestSession?.sessionToken;

        res.cookie('session_token',sessionToken,{
          httpOnly: true,
          secure : process.env.NODE_ENV === 'production',
          sameSite : 'lax',
          maxAge : 7 * 24 * 60 * 60 * 1000,
        });
      }
    }
    // attaching sessiontoken to req
    req.sessionToken = sessionToken;
    next();
  } catch (error) {
    next(error);
  }
}

const blockGuests = async(req : Request, res : Response, next : NextFunction)=>{
  if(!req.user){
    throw new ApiError(STATUS_CODE.UNAUTHORIZED,"This action requires authentication. Please sign in to continue.");
  }
  next();
};


const identifyUser = async(req : Request , res : Response, next : NextFunction) =>{
  try {
    const sessiontoken = req.cookies.session_token;

    if(!sessiontoken){
      return next();
    }

    const session = await getSessionByToken(sessiontoken);

    if(session){
      req.sessionToken = sessiontoken;
      if(session.userId && !session.isGuest){ // if both these condition exists then the user is already authenticated so authenticate middleware will handle it
        return next();
      }
    }

    next();
    
  } catch (error) {
    next(error);
  }

}


export {ensureGuestSession,blockGuests, identifyUser};
