import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import UserRepository from "../database/repositories/user.repository";

@Controller("/users")
@Authenticate()
export default class UserController {
  @Get("/orders/:id")
  @Authorize([SystemRole.User])
  public async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.getOrderById({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
  }
  @Get("/orders")
  @Authorize([SystemRole.User])
  public async getMyOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.getMyOrder({ req, res });
      res.locals.data = {
        orders: response.orders,
        count: response.count,
        pageIndex: response.pageIndex,
        pageSize: response.pageSize,
      };

      next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/register-to-sell")
  @Authorize([SystemRole.User])
  public async registerToSell(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.registerToSell({ req, res });
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
  }
  @Get("/")
  @Authorize([SystemRole.Admin])
  public async index(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.getAllUses(req);
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
  }

  @Post("/")
  @Authorize([SystemRole.Admin])
  public async add(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.add({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/send/app-report")
  @Authorize([SystemRole.User, SystemRole.Shopkeeper])
  public async sendAppReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.sendAppReport({ req, res });
      res.locals.message = "Send App Report Successfully";
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/resend-active-email")
  @Authorize("*")
  public async resendActiveEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserRepository.resendActiveEmail({ req, res });
      res.locals.message = "Resend active email successfully.";
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/:id")
  @Authorize([SystemRole.Admin])
  public async findById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.getUserById(req);
      res.locals.data = {
        user: response.user,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Put("/:id")
  @Authorize([SystemRole.Admin])
  public async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await UserRepository.update(req);
      res.locals.data = {
        user: response.user,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Delete("/:id")
  @Authorize([SystemRole.Admin])
  public async softDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserRepository.softDelete(req);
      res.locals.message = "User successfully deleted";
      next();
    } catch (error) {
      next(error);
    }
  }
  @Delete("/:id/permanently")
  @Authorize([SystemRole.Admin])
  public async hardDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await UserRepository.hardDelete(req);
      res.locals.message = "User successfully deleted permanently";
      next();
    } catch (error) {
      next(error);
    }
  }
}
