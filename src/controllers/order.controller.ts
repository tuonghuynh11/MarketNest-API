import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import OrderRepository from "../database/repositories/order.repository";

@Controller("/orders")
@Authenticate()
export default class OrderController {
  @Get("/:id")
  @Authorize([SystemRole.Shopkeeper, SystemRole.Admin])
  public async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await OrderRepository.getOrderById({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
  }
}
