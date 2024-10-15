import { NextFunction, Request, Response } from "express";
import Controller from "../decorators/controller";
import { Get } from "../decorators/handlers";
import ProductRepository from "../database/repositories/product.repository";

@Controller("/public")
export default class PublicController {
  @Get("/products")
  public async index(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ProductRepository.getAllProducts(req);
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
}
