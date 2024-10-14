import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import WishListRepository from "../database/repositories/wishlist.repository";

@Controller("/wishlists")
@Authenticate()
export default class WishListController {
  @Post("/")
  @Authorize([SystemRole.User, SystemRole.Shopkeeper])
  public async add(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await WishListRepository.addToWishList(req, res);
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Put("/")
  @Authorize([SystemRole.User, SystemRole.Shopkeeper])
  public async remove(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await WishListRepository.removeFromWishList(req, res);
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Get("/")
  @Authorize([SystemRole.User, SystemRole.Shopkeeper])
  public async get(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await WishListRepository.getWishList(req, res);
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
}
