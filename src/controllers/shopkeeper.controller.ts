import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ShopkeeperRepository from "../database/repositories/shopkeeper.repository";
import OrderRepository from "../database/repositories/order.repository";

@Controller("/shopkeepers")
@Authenticate()
export default class ShopkeeperController {
  @Get("/")
  @Authorize([SystemRole.Shopkeeper])
  public async index(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopkeeperRepository.getDashboardInfo({
        req,
        res,
      });
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
  }
  @Get("/products")
  @Authorize([SystemRole.Shopkeeper])
  public async getProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopkeeperRepository.getProducts({
        req,
        res,
      });
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/me")
  public async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopkeeperRepository.getMe({ req, res });
      res.locals.message = "Get shop information successfully.";
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Put("/me")
  public async updateMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopkeeperRepository.updateMe({ req, res });
      res.locals.message = "Update shop information successfully.";
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Get("/categories/:id/products")
  @Authorize([SystemRole.Shopkeeper])
  public async getProductsByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopkeeperRepository.getProductsByCategory({
        req,
        res,
      });
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/orders")
  @Authorize([SystemRole.Shopkeeper])
  public async getListOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await OrderRepository.getListOrder({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
  }
}
