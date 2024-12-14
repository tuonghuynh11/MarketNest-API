import { Request, Response } from "express";
import { FindManyOptions, In, IsNull, Not } from "typeorm";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { Shop } from "../entities/Shop";
import Discount, { DiscountStatus } from "../entities/Discount";
import { User } from "../entities/User";
import { UserDiscount } from "../entities/UserDiscount";

export default class DiscountRepository {
  static getAll = async ({ req, res }: { req: Request; res: Response }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const { pageSize, pageIndex, sortBy, orderBy, status, owner } = req.query;

    const discountRepository = dataSource.getRepository(Discount);

    let criteria: FindManyOptions<Discount> = {
      relations: {
        orders: true,
        shop: {
          owner: true,
        },
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        orders: {
          id: true,
        },
        shop: {
          owner: {
            id: true,
          },
          id: true,
          name: true,
        },
        description: true,
        campaign: true,
        code: true,
        discountPercentage: true,
        status: true,
        validUntil: true,
        conditions: {
          min_value: true,
          max_value: true,
        },
        quantity: true,
        used: true,
        id: true,
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
          status: status as DiscountStatus,
        },
      };
    }
    if (owner) {
      let temp = {};
      if (owner === "shopkeeper") {
        temp = {
          shop: {
            owner: {
              id: session.userId,
            },
          },
        };
      } else if (owner === "admin") {
        temp = {
          shop: IsNull(),
        };
      } else {
        temp = {
          status: DiscountStatus.ACTIVE,
        };
      }
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          ...temp,
        },
      };
    }

    const [discounts, count] = await discountRepository.findAndCount(criteria);

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      discounts,
    };
  };

  static getById = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const discountRepository = dataSource.getRepository(Discount);

    const discount = await discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError("Discount not found.");
    }
    return {
      ...discount,
    };
  };

  static getByShopId = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const discountRepository = dataSource.getRepository(Discount);
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({
      relations: {
        discounts: {
          discount: true,
        },
      },
      where: { id: session.userId },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }
    const usedDiscounts = user.discounts.filter(
      (discount: UserDiscount) => discount.used
    );
    const discounts = await discountRepository.find({
      relations: {
        shop: true,
      },
      where: [
        {
          shop: {
            id: id,
          },
          id: Not(
            In(
              usedDiscounts.map(
                (discount: UserDiscount) => discount.discount.id
              )
            )
          ),
        },
        {
          shop: undefined,
          id: Not(
            In(
              usedDiscounts.map(
                (discount: UserDiscount) => discount.discount.id
              )
            )
          ),
        },
      ],
    });

    return discounts;
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

  static update = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const {
      description,
      campaign,
      code,
      discountPercentage,
      conditions,
      quantity,
      validUntil,
      status,
    } = req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const discountRepository = dataSource.getRepository(Discount);
    const shopRepository = dataSource.getRepository(Shop);
    const discount = await discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError("Discount not found.");
    }

    discountRepository.merge(discount, {
      description,
      campaign,
      code,
      discountPercentage,
      conditions,
      quantity,
      validUntil,
      status,
    });

    await discountRepository.save(discount);
    return discount;
  };
  static hardDelete = async (req: Request, res: Response) => {
    const { id } = req.params;

    const { dataSource } = req.app.locals;
    const discountRepository = dataSource.getRepository(Discount);

    const discount = await discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError("Discount not found.");
    }

    if (discount.createdBy === "migration" || discount.used > 0) {
      throw new ForbiddenError("Cannot delete this product.");
    }

    await discountRepository.remove(discount);

    return {
      message: "Product successfully hard deleted.",
    };
  };
}
