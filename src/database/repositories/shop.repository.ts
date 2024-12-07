import { Request, Response } from "express";
import {
  FindManyOptions,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from "typeorm";
import { NotFoundError } from "../../utils/errors";
import { Shop } from "../entities/Shop";
import Discount from "../entities/Discount";
import { ShopStatus } from "../../utils/enums";
import ProductCategory from "../entities/ProductCategory";
import { omit } from "../../utils";
import { Product } from "../entities/Product";

export default class ShopRepository {
  static getAll = async ({ req, res }: { req: Request; res: Response }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const { pageSize, pageIndex, sortBy, orderBy, status } = req.query;

    const shopRepository = dataSource.getRepository(Shop);
    const categoryRepository = dataSource.getRepository(ProductCategory);

    let criteria: FindManyOptions<Shop> = {
      relations: {
        owner: true,
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        owner: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },

        status: true,
        city: true,
        state: true,
        country: true,
        address: true,
        rate: true,
      },
    };

    if (sortBy) {
      criteria = {
        ...criteria,
        order: {
          [sortBy as string]: orderBy,
        },
      };
    }
    if (status) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          status: status as ShopStatus,
        },
      };
    }

    const [shops, count] = await shopRepository.findAndCount(criteria);

    const shopCategories = await Promise.all(
      shops.map((shop: Shop) => {
        return categoryRepository.find({
          relations: ["products", "products.shop"],
          where: {
            products: {
              shop: {
                id: shop.id,
              },
            },
          },
        });
      })
    );

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      shops: shops.map((shop: Shop, index: number) => {
        return {
          ...shop,
          categories: shopCategories[index].map(
            (category: ProductCategory) => ({
              ...omit(category, ["products"]),
            })
          ),
        };
      }),
    };
  };

  static getById = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const shopRepository = dataSource.getRepository(Shop);
    const categoryRepository = dataSource.getRepository(ProductCategory);

    const shop = await shopRepository.findOne({
      relations: {
        products: true,
      },
      where: { id },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found.");
    }

    const categories = await categoryRepository.find({
      relations: ["products", "products.shop"],
      where: {
        products: {
          shop: {
            id: shop.id,
          },
        },
      },
    });

    return {
      ...omit(shop, ["products"]),
      categories: categories.map((category: ProductCategory) => ({
        ...omit(category, ["products"]),
      })),
    };
  };
  static getShopProduct = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;

    const {
      pageSize,
      pageIndex,
      searchName,
      facet,
      sortBy,
      orderBy,
      minPrice,
      maxPrice,
      rating,
    } = req.query;

    const productRepository = dataSource.getRepository(Product);

    let criteria: FindManyOptions<Product> = {
      relations: ["shop", "categories", "images"],
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        categories: {
          id: true,
          name: true,
          image: true,
          description: true,
        },
        images: {
          imageUrl: true,
        },
        shop: {
          id: true,
        },
      },
      where: {
        shop: {
          id,
        },
      },
    };

    if (sortBy) {
      criteria = {
        ...criteria,
        order: {
          [sortBy as string]: orderBy,
        },
      };
    }

    if (searchName) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          name: ILike(`%${searchName}%`),
        },
      };
    }

    if (facet) {
      const categoryIds = (facet as string).split(" ");
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          categories: {
            id: In(categoryIds as string[]),
          },
        },
      };
    }

    if (rating) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          rate: Number(rating),
        },
      };
    }

    if (minPrice && maxPrice) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          price:
            MoreThanOrEqual(Number(minPrice)) &&
            LessThanOrEqual(Number(maxPrice)),
        },
      };
    } else if (minPrice && !maxPrice) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          price: MoreThanOrEqual(Number(minPrice)),
        },
      };
    } else if (!minPrice && maxPrice) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          price: LessThanOrEqual(Number(maxPrice)),
        },
      };
    }
    const [products, count] = await productRepository.findAndCount(criteria);
    const categories: Map<string, any> = new Map();
    for (let product of products) {
      for (let category of product.categories) {
        if (categories.has(category.id)) {
          categories.set(category.id, {
            ...category,
            quantity: categories.get(category.id).quantity + 1,
          });
        } else {
          categories.set(category.id, {
            ...category,
            quantity: 1,
          });
        }
      }
    }

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      products: products.map((product: Product) => {
        return {
          ...omit(product, ["images"]),
          images: product.images.map((image) => image.imageUrl),
        };
      }),
      categories: Array.from(categories.values()),
    };
  };

  static create = async ({ req, res }: { req: Request; res: Response }) => {
    const {
      description,
      campaign,
      code,
      discountPercentage,
      conditions,
      quantity,
      validUntil,
      shopId,
    } = req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const discountRepository = dataSource.getRepository(Discount);
    const shopRepository = dataSource.getRepository(Shop);
    let discount = {};
    if (shopId) {
      const shop = await shopRepository.findOneBy({ id: shopId });
      if (!shop) {
        throw new NotFoundError("Shop not found.");
      }
      discount = discountRepository.create({
        createdBy: session.userId,
        description,
        campaign,
        code,
        discountPercentage,
        conditions,
        quantity,
        validUntil,
        shop,
      });
    } else {
      discount = discountRepository.create({
        createdBy: session.userId,
        description,
        campaign,
        code,
        discountPercentage,
        conditions,
        quantity,
        validUntil,
      });
    }

    await discountRepository.save(discount);

    return discount;
  };

  static updateShopStatus = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { id } = req.params;
    const { status } = req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const shopRepository = dataSource.getRepository(Shop);
    const shop = await shopRepository.findOne({
      where: { id },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found.");
    }

    shopRepository.merge(shop, {
      status,
    });

    await shopRepository.save(shop);
    return shop;
  };

  static getShopByUser = async ({ dataSource, userId }: any) => {
    const shopRepository = dataSource.getRepository(Shop);

    const shops = await shopRepository.find({
      where: {
        owner: {
          id: userId,
        },
      },
    });

    return {
      shops: shops.map((shop: Shop) => omit(shop, ["owner"])),
    };
  };
}
