import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ShopRepository from "../database/repositories/shop.repository";

@Controller("/shops")
@Authenticate()
export default class ShopController {
  @Get("")
  @Authorize([SystemRole.Admin])
  public async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopRepository.getAll({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Authorize([SystemRole.Admin])
  @Get("/:id")
  public async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopRepository.getById({ req, res });
      res.locals.data = {
        shop: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Authorize([SystemRole.Admin])
  @Get("/:id/products")
  public async getShopProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopRepository.getShopProduct({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Authorize([SystemRole.Admin])
  @Put("/:id")
  public async updateShopStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ShopRepository.updateShopStatus({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
}
