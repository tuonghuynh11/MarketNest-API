import { NextFunction, Request, Response } from "express";
import Controller from "../decorators/controller";
import { Get } from "../decorators/handlers";
import ProductRepository from "../database/repositories/product.repository";

@Controller("/public")
export default class PublicController {
  @Get("/products")
  public async getProduct(
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
  @Get("/categories/:id/products")
  public async getProductByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ProductRepository.getProductsByCategory(req);
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
}
