import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ReportRepository from "../database/repositories/report.repository";

Authenticate();
@Controller("/reports")
export default class ReportController {
  @Post("/app")
  @Authorize([SystemRole.User, SystemRole.Shopkeeper])
  public async add(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ReportRepository.add({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/app")
  @Authorize([SystemRole.Admin])
  public async getAllAppReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ReportRepository.getAllAppReport(req);
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Get("/shops")
  @Authorize([SystemRole.Admin])
  public async getAllShopReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ReportRepository.getAllShopReport(req);
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Put("/app/status")
  public async updateReportStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ReportRepository.updateReportStatus({ req, res });
      res.locals.data = response;

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  /////Is it ok to delete products cause it can link to many others table, how to handle all the cases?
}
