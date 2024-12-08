import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import AdminRepository from "../database/repositories/admin.repository";

@Controller("/admin")
@Authenticate()
export default class AdminController {
  @Get("/products")
  @Authorize([SystemRole.Admin])
  public async getProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AdminRepository.getProducts({
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
