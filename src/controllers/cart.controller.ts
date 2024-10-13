import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ProductCategoryRepository from "../database/repositories/category.repository";
import CartRepository from "../database/repositories/cart.repository";

@Controller("/carts")
@Authenticate()
export default class CartController {
  @Get("/")
  @Authorize([SystemRole.User])
  public async getUserCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await CartRepository.getCart(req, res);
      res.locals.data = {
        cart: response.cart,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Post("/")
  @Authorize([SystemRole.User])
  public async addToCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await CartRepository.addToCart(req, res);
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Put("/")
  @Authorize([SystemRole.User])
  public async updateQuantity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await CartRepository.updateCartQuantity( req, res );
      res.locals.data = {
        message: response.message,
        cart: response.cart,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Put("/clear-one")
  @Authorize([SystemRole.User])
  public async removeFromCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await CartRepository.removeFromCart(req, res);
      res.locals.message = response.message;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Put("/clear-all")
  @Authorize([SystemRole.User])
  public async removeAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await CartRepository.clearCart(req, res);
      res.locals.message = response.message;
      next();
    } catch (error) {
      next(error);
    }
  }
}
