import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ShopkeeperRepository from "../database/repositories/shopkeeper.repository";

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
}
