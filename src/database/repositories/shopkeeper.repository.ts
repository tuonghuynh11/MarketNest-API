import { Request, Response } from "express";
import Order from "../entities/Order";
import { OrderStatus } from "../../utils/enums";
import { ProfitCalculation } from "../../utils/interfaces";
import { Product } from "../entities/Product";
import { Between, ILike, Not } from "typeorm";
import OrderDetail from "../entities/OrderDetail";
import { Shop } from "../entities/Shop";
import { omit } from "../../utils";
import config from "../../configuration";
import { verify } from "jsonwebtoken";
import ProductCategory from "../entities/ProductCategory";
export default class ShopkeeperRepository {
  static getDashboardInfo = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const orderRepository = dataSource.getRepository(Order);
    const orderDetailRepository = dataSource.getRepository(OrderDetail);
    const shopRepository = dataSource.getRepository(Shop);

    //Get shop information
    const shop = await shopRepository.findOne({
      where: {
        owner: {
          id: session.userId,
        },
      },
    });

    console.log("Pass");
    if (!shop) {
      throw new Error("Shop not found");
    }

    const temp = new Date();
    // Get the start date of the current month (1st day of the month)
    const startDate = new Date(temp.getFullYear(), temp.getMonth(), 1);

    // Get the end date of the current month (last day of the month)
    const endDate = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
    const [
      ordersOfToday,
      totalQuantityOfSoldProducts,
      totalCurrentOfProducts,
      numberOfOldCustomers,
      numberOfNewCustomers,
      currentProfit,
      totalProfit,
      profitForEachDay,
    ] = await Promise.all([
      orderRepository.count({
        where: {
          shop: {
            owner: {
              id: session.userId,
            },
          },
          createdAt: new Date(),
        },
      }),
      orderDetailRepository
        .createQueryBuilder("od")
        .innerJoin("od.product", "p")
        .innerJoin("p.shop", "s")
        .innerJoin("od.order", "o")
        .where("s.ownerId = :ownerId", { ownerId: session.userId })
        .andWhere("o.orderStatus = :status", { status: "Completed" })
        .select("SUM(od.quantity)", "totalQuantity")
        .getRawOne(),
      orderRepository.query(
        `
        SELECT SUM(stock)
        FROM products
        WHERE "shopId" IN 
        (SELECT id FROM shops WHERE "ownerId" = $1)
        `,
        [session.userId]
      ),
      orderRepository.query(
        `select COUNT(u.id) AS "count"
          FROM users u
          JOIN orders o
          ON u.id = o."userId" 
          WHERE o."shopId"
          in
          (SELECT id FROM shops WHERE "ownerId" = $1)
          AND "orderStatus"  = 'Completed'
          AND o."createdAt"  < now()
          GROUP BY u.id
          having COUNT(o.id) > 1`,
        [session.userId]
      ),
      orderRepository.query(
        `SELECT COUNT(u.id) 
          FROM users u 
          JOIN orders o
           ON u.id = o."userId"
            WHERE o."shopId" IN
             (SELECT id FROM shops WHERE "ownerId" = $1)
            AND "orderStatus" = 'Completed' 
            GROUP BY u.id
            HAVING u.id NOT IN 
            (
            select k.id
            FROM users k
            JOIN orders m
            ON k.id = m."userId" 
            WHERE m."shopId"
            in
            (SELECT id FROM shops WHERE "ownerId" = $1)
            AND "orderStatus"  = 'Completed'
            AND m."createdAt"  < now()
            GROUP BY k.id
            having COUNT(m.id) > 1
            )
            `,
        [session.userId]
      ),
      ShopkeeperRepository.calculateTotalProfit(req, temp, temp),
      ShopkeeperRepository.calculateTotalProfit(
        req,
        new Date(shop.createdAt),
        temp
      ),
      this.calculateTotalProfitForEachDay(req, startDate, endDate),
    ]);

    // StockPercent
    const stockPercent =
      (Number(totalCurrentOfProducts[0].sum) /
        (Number(totalQuantityOfSoldProducts.totalQuantity) +
          Number(totalCurrentOfProducts[0].sum))) *
      100;

    //NewUsersPercent
    let newUsersPercent = 0;
    if (numberOfNewCustomers.length + numberOfOldCustomers.length > 0) {
      newUsersPercent =
        (numberOfNewCustomers.length /
          (numberOfOldCustomers.length + numberOfNewCustomers.length)) *
        100;
    }

    return {
      ordersOfToday,
      totalQuantityOfSoldProducts: Number(
        totalQuantityOfSoldProducts.totalQuantity
      ),
      totalCurrentQuantityOfProducts: Number(totalCurrentOfProducts[0].sum),
      stockPercent: Math.floor(stockPercent),
      newUsersPercent,
      currentProfit,
      todayTotalProfit: totalProfit,
      profitForEachDay,
    };
  };
  static calculateProfitForOrder = async (
    req: Request,
    orderId: string
  ): Promise<ProfitCalculation | null> => {
    const { dataSource } = req.app.locals;
    const orderRepository = dataSource.getRepository(Order);
    const productRepository = dataSource.getRepository(Product);
    const order = await orderRepository.findOne({
      relations: ["orderDetails", "discount", "orderDetails.product"],
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Revenue = totalAmount - discount
    const discountAmount = order.discount
      ? Math.floor(
          (order.totalAmount * order.discount.discountPercentage) / 100
        )
      : 0; // Assuming discount has an 'amount' field
    const revenue = order.totalAmount - discountAmount;

    // COGS = sum(quantity * costPrice)
    let cogs = 0;
    for (const detail of order.orderDetails) {
      const product = await productRepository.findOneBy({
        id: detail.product.id,
      });
      if (!product) {
        throw new Error(`Product with ID ${detail.product.id} not found`);
      }
      cogs += detail.quantity * product.price; // Assuming 'price' is the cost price
    }

    const deliveryCost = order.shippingFee;

    const profit = revenue - cogs - deliveryCost;

    return {
      orderId: order.id,
      revenue,
      cogs,
      deliveryCost,
      discount: discountAmount,
      profit,
    };
  };

  /**
   * Calculate total profit over a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Total profit
   */
  static calculateTotalProfit = async (
    req: Request,
    startDate: Date,
    endDate: Date
  ): Promise<number> => {
    const { dataSource } = req.app.locals;
    const orderRepository = dataSource.getRepository(Order);
    const productRepository = dataSource.getRepository(Product);
    const orders = await orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        orderStatus: Not(OrderStatus.CANCELLED), // Exclude cancelled orders
      },
      relations: ["orderDetails", "discount", "orderDetails.product"],
    });

    console.log("Orders:", JSON.stringify(orders, null, 2));
    let totalProfit = 0;

    for (const order of orders) {
      // Revenue
      const discountAmount = order.discount
        ? Math.floor(
            (order.totalAmount * order.discount.discountPercentage) / 100
          )
        : 0; // Assuming discount has an 'amount' field
      const revenue = order.totalAmount - discountAmount;

      // COGS
      let cogs = 0;
      for (const detail of order.orderDetails) {
        const product = await productRepository.findOne({
          where: {
            id: detail.product.id,
          },
        });
        if (!product) {
          throw new Error(`Product with ID ${detail.product.id} not found`);
        }
        cogs += detail.quantity * product.price;
      }

      // Delivery Cost
      const deliveryCost = order.shippingFee;

      // Profit
      const profit = revenue - cogs - deliveryCost;
      totalProfit += profit;
    }

    return totalProfit;
  };

  static calculateTotalProfitForEachDay = async (
    req: Request,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; profit: number }[]> => {
    const { dataSource } = req.app.locals;
    const orderRepository = dataSource.getRepository(Order);
    const productRepository = dataSource.getRepository(Product);

    // Fetch orders within the date range, excluding cancelled ones
    const orders = await orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        orderStatus: Not(OrderStatus.CANCELLED),
      },
      relations: ["orderDetails", "discount", "orderDetails.product"],
    });

    // Store results for each order with date and profit
    const profitsByDate: { date: Date; profit: number }[] = [];

    for (const order of orders) {
      // Calculate revenue with discount
      const discountAmount = order.discount
        ? Math.floor(
            (order.totalAmount * order.discount.discountPercentage) / 100
          )
        : 0;
      const revenue = order.totalAmount - discountAmount;

      // Calculate COGS (Cost of Goods Sold)
      let cogs = 0;
      for (const detail of order.orderDetails) {
        const product = await productRepository.findOne({
          where: {
            id: detail.product.id,
          },
        });
        if (!product) {
          throw new Error(`Product with ID ${detail.product.id} not found`);
        }
        cogs += detail.quantity * product.price;
      }

      // Delivery cost
      const deliveryCost = order.shippingFee;

      // Calculate profit
      const profit = revenue - cogs - deliveryCost;

      // Save the date and profit for the current order
      profitsByDate.push({
        date: order.createdAt, // Store the order's creation date
        profit: profit,
      });
    }

    return profitsByDate;
  };

  static getProducts = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { session } = res.locals;
    const { dataSource } = req.app.locals;

    const { pageSize, pageIndex, searchName } = req.query;

    const productRepository = dataSource.getRepository(Product);
    const shopRepository = dataSource.getRepository(Shop);

    const shop = await shopRepository.findOne({
      where: {
        owner: {
          id: session.userId,
        },
      },
    });

    if (!shop) {
      throw new Error("Shop not found");
    }
    const [products, count] = await productRepository.findAndCount({
      relations: ["categories", "images"],
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      where: {
        shop: {
          id: shop.id,
        },
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
        },
      },
    });

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : undefined,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : undefined,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      products: products.map((product: Product) => {
        return {
          ...omit(product, ["images"]),
          images: product.images.map((image) => image.imageUrl),
        };
      }),
    };
  };
  static getProductsByCategory = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { session } = res.locals;
    const { dataSource } = req.app.locals;

    const { pageSize, pageIndex, searchName } = req.query;

    const productRepository = dataSource.getRepository(Product);
    const shopRepository = dataSource.getRepository(Shop);
    const categoryRepository = dataSource.getRepository(ProductCategory);

    const shop = await shopRepository.findOne({
      where: {
        owner: {
          id: session.userId,
        },
      },
    });

    if (!shop) {
      throw new Error("Shop not found");
    }

    const category = await categoryRepository.findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const [products, count] = await productRepository.findAndCount({
      relations: ["categories", "images"],
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      where: {
        shop: {
          id: shop.id,
        },
        categories: {
          id: req.params.id,
        },
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
        },
      },
    });

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : undefined,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : undefined,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      products: products.map((product: Product) => {
        return {
          ...omit(product, ["images"]),
          images: product.images.map((image) => image.imageUrl),
        };
      }),
    };
  };

  static getMe = async ({ req, res }: { req: Request; res: Response }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    verify(session.accessToken, config.jwtAccessKey);
    const categoryRepository = dataSource.getRepository(ProductCategory);
    const shopRepository = dataSource.getRepository(Shop);

    const shop = await shopRepository.findOneBy({
      owner: {
        id: session.userId,
      },
    });

    if (!shop) {
      throw new Error("Shop not found");
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
      ...shop,
      categories: categories.map((category: ProductCategory) => ({
        ...omit(category, ["products"]),
      })),
    };
  };
}
