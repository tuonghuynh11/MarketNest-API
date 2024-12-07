import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import RefundRequestRepository from "../database/repositories/refundRequest.repository";

@Controller("/refund-requests")
@Authenticate()
export default class RefundRequestController {
  @Post("/")
  @Authorize([SystemRole.User])
  public async createRefundRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await RefundRequestRepository.create({ req, res });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  @Put("/:id/status")
  @Authorize([SystemRole.Shopkeeper])
  public async updateRefundRequestStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await RefundRequestRepository.update({
        req,
        res,
      });
      res.locals.data = {
        ...response,
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("")
  @Authorize([SystemRole.Shopkeeper])
  public async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await RefundRequestRepository.getAll({ req, res });
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
      const response = await RefundRequestRepository.getById({ req, res });
      res.locals.data = {
        refundRequest: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  /////Is it ok to delete products cause it can link to many others table, how to handle all the cases?
  @Delete("/:id")
  @Authorize([SystemRole.Shopkeeper])
  public async softDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await RefundRequestRepository.softDelete(req, res);
      res.locals.message = "Refund request successfully deleted";
      next();
    } catch (error) {
      next(error);
    }
  }
}
