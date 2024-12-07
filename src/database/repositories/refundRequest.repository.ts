import { Request, Response } from "express";
import { Product } from "../entities/Product";
import { FindManyOptions } from "typeorm";
import { NotFoundError } from "../../utils/errors";
import RefundRequest from "../entities/RefundRequest";
import Order from "../entities/Order";
import { User } from "../entities/User";
import { createNotification } from "./notification.repository";
import { RefundStatusesEnumActive } from "../../common/constants/refund-status.enum";
import { OrderStatus, RefundStatus } from "../../utils/enums";
import { omit } from "../../utils";

export default class RefundRequestRepository {
  static getAll = async ({ req, res }: { req: Request; res: Response }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const { pageSize, pageIndex, sortBy, orderBy, status } = req.query;

    const refundRequestRepository = dataSource.getRepository(RefundRequest);

    let criteria: FindManyOptions<RefundRequest> = {
      relations: {
        user: true,
        order: true,
        product: true,
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        user: {
          id: true,
          username: true,
          avatar: true,
        },
        requestDate: true,
        refundReason: true,
        approvalDate: true,
        status: true,
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
    console.log("criteria", criteria);
    if (status) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          status: status as RefundStatus,
        },
      };
    }

    const [refundRequests, count] = await refundRequestRepository.findAndCount(
      criteria
    );

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      refundRequests,
    };
  };

  static getById = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const refundRequestRepository = dataSource.getRepository(RefundRequest);

    const refundRequest = await refundRequestRepository.findOne({
      where: { id },
      relations: {
        user: true,
        order: true,
        product: true,
      },
    });

    if (!refundRequest) {
      throw new NotFoundError("Refund Request not found.");
    }
    return {
      ...refundRequest,
    };
  };

  static create = async ({ req, res }: { req: Request; res: Response }) => {
    const {
      userId,
      orderId,
      productId,
      quantity,
      price,
      images,
      refundReason,
    } = req.body;

    const { dataSource, socket } = req.app.locals;
    const { session } = res.locals;
    const refundRequestRepository = dataSource.getRepository(RefundRequest);
    const orderRepository = dataSource.getRepository(Order);
    const userRepository = dataSource.getRepository(User);
    const productRepository = dataSource.getRepository(Product);

    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: {
        shop: {
          owner: true,
        },
      },
    });
    if (!order) {
      throw new NotFoundError("Order not found.");
    }

    const product = await productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    const refundRequest = refundRequestRepository.create({
      user,
      order,
      product,
      quantity,
      // images: {
      //   images: [...images],
      // },
      images,
      refundReason,
      requestDate: new Date(),
      price,
      createdBy: session.userId,
    });

    order.refundStatus = RefundStatus.PENDING;
    order.orderStatus = OrderStatus.REFUND;
    await Promise.all([
      refundRequestRepository.save(refundRequest),
      orderRepository.save(order),
    ]);

    const urlRefundRequest = `/refund-request/${refundRequest!.id}`;

    await createNotification({
      title: "Refund Request has been created",
      assignee: order!.shop.owner?.id,
      content: `${user.username} has been created a refund request for ${
        order!.id
      }`,
      createdBy: "System",
      dataSource: dataSource,
      socket: socket,
      actions: urlRefundRequest,
    });
    return {
      ...omit(refundRequest, ["user", "order", "product"]),
    };
  };

  static update = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const { shopkeeperReply, status } = req.body;

    const { dataSource } = req.app.locals;
    const refundRequestRepository = dataSource.getRepository(RefundRequest);
    const orderRepository = dataSource.getRepository(Order);

    const refundReq = await refundRequestRepository.findOne({
      where: { id },
      relations: {
        order: true,
      },
    });

    if (!refundReq) {
      throw new NotFoundError("Refund Request not found.");
    }
    const order = await orderRepository.findOne({
      where: { id: refundReq.order.id },
    });
    refundRequestRepository.merge(refundReq, {
      shopkeeperReply,
      status,
    });
    if (order) {
      orderRepository.merge(order, {
        refundStatus: status,
      });
      switch (status) {
        case RefundStatus.COMPLETED:
          order.orderStatus = OrderStatus.REFUND_COMPLETED;
          refundReq.approvalDate = new Date();
          break;
        case RefundStatus.REJECTED:
          order.orderStatus = OrderStatus.REFUND_REJECTED;
          break;
        case RefundStatus.FAILED:
          order.orderStatus = OrderStatus.REFUND_FAILED;
          break;
      }
    }
    await Promise.all([
      refundRequestRepository.save(refundReq),
      orderRepository.save(order!),
    ]);
    return {
      ...omit(refundReq, ["user", "order", "product"]),
    };
  };

  static softDelete = async (req: Request, res: Response) => {
    const { id } = req.params;

    const { dataSource } = req.app.locals;
    const refundRequestRepository = dataSource.getRepository(RefundRequest);

    const refundRequest = await refundRequestRepository.findOne({
      where: { id },
    });

    if (!refundRequest) {
      throw new NotFoundError("Refund Request not found.");
    }

    await refundRequestRepository.softDelete({ id });

    return {
      message: "Refund Request successfully soft deleted.",
    };
  };

  static checkChangeRefundStatusWorkFlow = (
    currentStatus: RefundStatus,
    newStatus: RefundStatus
  ) => {
    if (
      !RefundStatusesEnumActive[
        currentStatus as keyof typeof RefundStatusesEnumActive
      ].includes(newStatus)
    ) {
      return `Can not update refund request status to ${newStatus}`;
    }
    return null;
  };
}
