import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import DiscountRepository from "../database/repositories/discount.repository";

@Controller("/discounts")
@Authenticate()
export default class DiscountController {
  @Post("/")
  @Authorize([SystemRole.Shopkeeper, SystemRole.Admin])
  public async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await DiscountRepository.create({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  @Put("/:id")
  @Authorize([SystemRole.Shopkeeper, SystemRole.Admin])
  public async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await DiscountRepository.update({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Get("")
  @Authorize([SystemRole.Shopkeeper, SystemRole.User, SystemRole.Admin])
  public async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await DiscountRepository.getAll({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/:id")
  public async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await DiscountRepository.getById({ req, res });
      res.locals.data = {
        discount: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Get("/shop/:id")
  public async getByShopId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await DiscountRepository.getByShopId({ req, res });
      res.locals.data = {
        discount: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Delete("/:id/permanently")
  @Authorize([SystemRole.Admin, SystemRole.Shopkeeper])
  public async hardDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await DiscountRepository.hardDelete(req, res);
      res.locals.message = "Discount successfully deleted permanently";
      next();
    } catch (error) {
      next(error);
    }
  }
}
