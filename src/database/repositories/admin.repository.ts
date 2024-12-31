import { Request, Response } from "express";
import { Product, ProductStatus } from "../entities/Product";
import { FindManyOptions, ILike } from "typeorm";
import { Shop } from "../entities/Shop";
import { omit } from "../../utils";
export default class AdminRepository {
  static getProducts = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { session } = res.locals;
    const { dataSource } = req.app.locals;

    const { pageSize, pageIndex, searchName, status, shopId } = req.query;

    const productRepository = dataSource.getRepository(Product);
    const shopRepository = dataSource.getRepository(Shop);

    let criteria: FindManyOptions<Product> = {
      relations: ["categories", "images"],
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      where: {
        name: searchName ? ILike(`%${searchName}%`) : undefined,
      },
      select: {
        categories: {
          id: true,
          name: true,
          image: true,
          description: true,
        },
        images: {
          imageUrl: true,
          order: true,
        },
      },
    };
    if (shopId) {
      const shop = await shopRepository.findOne({
        where: {
          id: shopId as string,
        },
      });
      if (!shop) {
        throw new Error("Shop not found");
      }
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          shop: {
            id: shopId as string,
          },
        },
      };
    }
    if (status) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          status: status as ProductStatus,
        },
      };
    }
    const [products, count] = await productRepository.findAndCount(criteria);

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : undefined,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : undefined,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      products: products.map((product: Product) => {
        return {
          ...omit(product, ["images"]),
          images: product.images
            .sort((a: any, b: any) => a.order - b.order)
            .map((image) => image.imageUrl),
        };
      }),
    };
  };
}
