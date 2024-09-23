import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import RoleRepository from "../database/repositories/role.repository";

@Controller("/roles")
@Authenticate()
export default class RoleController {
  @Get("/")
  @Authorize([SystemRole.Admin])
  public async index(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await RoleRepository.getAllRoles(req);
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
  }
}
