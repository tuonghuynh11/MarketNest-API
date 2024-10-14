import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ProductRepository from "../database/repositories/product.repository";

@Controller("/products")
export default class ProductController {
  @Get("/")
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

  @Post("/")
  @Authorize([SystemRole.Shopkeeper])
  public async add(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ProductRepository.add({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/:id")
  public async findById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ProductRepository.getProductById(req);
      res.locals.data = {
        product: response.product,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Put("/:id")
  @Authorize([SystemRole.Shopkeeper])
  public async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ProductRepository.update({req, res});
      res.locals.data = {
        product: response.product,
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
      await ProductRepository.softDelete(req, res);
      res.locals.message = "Product successfully deleted";
      next();
    } catch (error) {
      next(error);
    }
  }
  @Delete("/:id/permanently")
  @Authorize([SystemRole.Shopkeeper])
  public async hardDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await ProductRepository.hardDelete(req,res);
      res.locals.message = "Product successfully deleted permanently";
      next();
    } catch (error) {
      next(error);
    }
  }
}
