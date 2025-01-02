import { Request, Response } from "express";
import { Product, ProductStatus } from "../entities/Product";
import {
  And,
  FindManyOptions,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from "typeorm";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { Shop } from "../entities/Shop";
import ProductCategory from "../entities/ProductCategory";
import ProductImage from "../entities/ProductImage";
import { omit } from "../../utils";

export default class ProductRepository {
  static getAllProducts = async (req: Request) => {
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
      place,
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
          id: true,
          imageUrl: true,
          order: true,
        },
      },
      where: {
        status: ProductStatus.ACTIVE,
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
    if (place) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          shop: {
            city: place.toString(),
          },
        },
      };
    }

    if (minPrice && maxPrice) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          price: And(
            MoreThanOrEqual(Number(minPrice)),
            LessThanOrEqual(Number(maxPrice))
          ),
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
          images: product.images
            .sort((a: any, b: any) => a.order - b.order)
            .map((image: any) => image.imageUrl),
        };
      }),
      categories: Array.from(categories.values()),
    };
  };
  static getProductsByCategory = async (req: Request) => {
    const { dataSource } = req.app.locals;

    const {
      pageSize,
      pageIndex,
      searchName,
      sortBy,
      orderBy,
      minPrice,
      maxPrice,
      rating,
      place,
    } = req.query;
    const { id } = req.params;
    const productRepository = dataSource.getRepository(Product);

    let criteria: FindManyOptions<Product> = {
      relations: ["shop", "categories", "images"],
      where: {
        categories: {
          id: In([id]),
        },
      },
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
          order: true,
          imageUrl: true,
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

    if (rating) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          rate: Number(rating),
        },
      };
    }
    if (place) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          shop: {
            city: place.toString(),
          },
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

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
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
  static getRelatedProducts = async (req: Request) => {
    const { dataSource } = req.app.locals;

    const { id } = req.params;
    const productRepository = dataSource.getRepository(Product);

    const product = await productRepository.findOne({
      relations: ["shop", "categories", "images"],
      where: { id },
    });

    if (!product) {
      throw new NotFoundError("Product is not found.");
    }

    console.log(product);

    let criteria: FindManyOptions<Product> = {
      relations: ["shop", "categories", "images"],
      where: {
        categories: {
          id: In([id]),
        },
      },
      select: {
        categories: {
          id: true,
          name: true,
          image: true,
          description: true,
        },
        images: {
          order: true,
          imageUrl: true,
        },
      },
    };
    const [products] = await productRepository.find(criteria);

    const categoriesId: string[] = product.categories.map((category: any) => {
      return category.id;
    });

    const relatedProducts = await productRepository.find({
      relations: ["shop", "categories", "images"],
      where: {
        categories: {
          id: In(categoriesId),
        },
        id: Not(id),
      },
      take: 20,
    });
    return {
      related_products: relatedProducts.map((product: Product) => {
        return {
          ...omit(product, ["images"]),
          images: product.images
            .sort((a: any, b: any) => a.order - b.order)
            .map((image) => image.imageUrl),
        };
      }),
    };
  };

  static getProductById = async (req: Request) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const productRepository = dataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id },
      relations: ["shop", "categories", "images", "ratings"],
    });

    if (!product) {
      throw new NotFoundError("Product is not found.");
    }
    return {
      ...product,
      images: product.images.sort((a: any, b: any) => a.order - b.order),
      ratings: product.ratings.length,
    };
  };

  static add = async ({ req, res }: { req: Request; res: Response }) => {
    const { name, description, price, stock, shopId, categoryIds, imageUrls } =
      req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const productRepository = dataSource.getRepository(Product);
    const shopRepository = dataSource.getRepository(Shop);
    const categoryRepository = dataSource.getRepository(ProductCategory);
    const imageRepository = dataSource.getRepository(ProductImage);

    const shop = await shopRepository.findOneBy({ id: shopId });
    if (!shop) {
      throw new NotFoundError("Shop not found.");
    }

    const categories = await categoryRepository.findByIds(categoryIds);
    if (categories.length !== categoryIds.length) {
      throw new NotFoundError("One or more categories not found.");
    }

    const product = productRepository.create({
      name,
      description,
      price,
      stock,
      shop,
      categories,
      createdBy: session.userId,
    });

    await productRepository.save(product);

    if (imageUrls && imageUrls.length > 0) {
      const images = imageUrls.map((imageUrl: string, index: number) => {
        const image = imageRepository.create({
          imageUrl,
          product,
          order: index,
        });
        return image;
      });
      await imageRepository.save(images);
    }

    return {
      product: {
        ...product,
        categories,
      },
    };
  };

  static update = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      stock,
      shopId,
      categoryIds,
      imageUrls,
      status,
    } = req.body;
    console.log("Body:", req.body);
    const { dataSource } = req.app.locals;
    const productRepository = dataSource.getRepository(Product);
    const shopRepository = dataSource.getRepository(Shop);
    const categoryRepository = dataSource.getRepository(ProductCategory);
    const imageRepository = dataSource.getRepository(ProductImage);

    const product = await productRepository.findOne({
      where: { id },
      relations: ["categories", "images"],
    });

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    if (shopId) {
      const shop = await shopRepository.findOneBy({ id: shopId });
      if (!shop) {
        throw new NotFoundError("Shop not found.");
      }
      product.shop = shop;
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;

    if (status) {
      if (product.status === ProductStatus.ADMIN_DISABLED) {
        throw new ForbiddenError(
          "Cannot update status of ADMIN_DISABLED product"
        );
      } else {
        if (status === ProductStatus.ADMIN_DISABLED) {
          throw new ForbiddenError("Cannot update status to ADMIN_DISABLED");
        } else {
          product.status = status || product.status;
        }
      }
    }
    console.log("Product updated", product.status);
    if (categoryIds) {
      const categories = await categoryRepository.findByIds(categoryIds);
      if (categories.length !== categoryIds.length) {
        throw new NotFoundError("One or more categories not found.");
      }
      product.categories = categories;
    }

    await productRepository.save(product);

    if (imageUrls) {
      // if (imageUrls.length === 0) {
      //   await imageRepository.delete({ product: { id } });
      // } else {
      //   const existingImages = await imageRepository.find({
      //     where: { product: { id } },
      //   });
      //   const newImages = imageUrls.map((imageUrl: string, index: number) => {
      //     const image = existingImages.find(
      //       (img: ProductImage) => img.imageUrl === imageUrl
      //     );
      //     if (image) {
      //       image.order = index;
      //       return image;
      //     }
      //     return imageRepository.create({ imageUrl, product, order: index });
      //   });

      //   await imageRepository.save(newImages);
      // }
      await imageRepository.delete({ product: { id } });
      const images = imageUrls.map((imageUrl: string, index: number) => {
        const image = imageRepository.create({
          imageUrl,
          product,
          order: index,
        });
        return image;
      });
      await imageRepository.save(images);
    }
    const images = await imageRepository.find({
      where: { product: { id } },
      order: {
        order: "ASC",
      },
      select: {
        id: true,
        imageUrl: true,
        order: true,
      },
    });
    return {
      product: {
        ...product,
        categories: product.categories,
        images,
      },
    };
  };
  static updateByAdmin = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { id } = req.params;
    const { status } = req.body;
    const { dataSource } = req.app.locals;
    const productRepository = dataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id },
      relations: ["categories", "images"],
    });

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    product.status = status || product.status;

    await productRepository.save(product);

    return product;
  };

  static softDelete = async (req: Request, res: Response) => {
    const { id } = req.params;

    const { dataSource } = req.app.locals;
    const productRepository = dataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id },
      relations: ["shop", "categories", "images"],
    });

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    if (product.createdBy === "migration") {
      throw new ForbiddenError("Cannot delete this product.");
    }

    await productRepository.softDelete({ id });

    return {
      message: "Product successfully soft deleted.",
    };
  };
  static hardDelete = async (req: Request, res: Response) => {
    const { id } = req.params;

    const { dataSource } = req.app.locals;
    const productRepository = dataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id },
      relations: ["shop", "categories", "images"],
    });

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    if (product.createdBy === "migration") {
      throw new ForbiddenError("Cannot delete this product.");
    }

    await productRepository.remove(product);

    return {
      message: "Product successfully hard deleted.",
    };
  };
}
