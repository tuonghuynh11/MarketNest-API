import { Request, Response } from "express";
import Order from "../entities/Order";
import { NotAcceptableError } from "../../utils/errors";
import { omit } from "../../utils";
import OrderDetail from "../entities/OrderDetail";
import { SystemRole } from "../../utils/enums";

export default class OrderRepository {
  static getOrderById = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { id } = req.params;
    const { session } = res.locals;
    const { dataSource } = req.app.locals;
    const orderRepository = dataSource.getRepository(Order);

    const order: Order | null = await orderRepository.findOne({
      relations: [
        "paymentMethod",
        "shippingMethod",
        "address",
        "discount",
        "orderDetails",
        "orderDetails.product",
        "orderDetails.product.shop",
        "orderDetails.product.shop.owner",
        "orderDetails.product.images",
        "orderDetails.product.categories",
      ],
      where: {
        id,
      },
    });
    if (!order) {
      throw new NotAcceptableError("Order not found");
    }
    if (session.role === SystemRole.Shopkeeper) {
      const isOwnerOfOrder = order.orderDetails.filter(
        (orderDetail: OrderDetail) => {
          return orderDetail.product.shop?.owner?.id === session.userId;
        }
      );
      if (isOwnerOfOrder.length === 0) {
        throw new NotAcceptableError("You are not owner of this order");
      }
    }

    const formatData = {
      ...omit(order, [
        "paymentMethod",
        "shippingMethod",
        "discount",
        "orderDetails",
      ]),
      paymentMethod: order.paymentMethod?.name,
      shippingMethod: {
        name: order.shippingMethod?.name,
        type: order.shippingMethod?.type,
      },
      discount: {
        id: order.discount?.id,
        description: order.discount?.description,
        discountPercentage: order.discount?.discountPercentage,
      },
      orderDetails: order.orderDetails.map((orderDetail: OrderDetail) => ({
        ...omit(orderDetail, ["product"]),
        product: {
          ...omit(orderDetail.product, [
            "shop",
            "images",
            "categories",
            "createdBy",
            "createdAt",
            "updatedAt",
            "updatedBy",
            "deletedAt",
            "deletedBy",
          ]),
          shop: {
            id: orderDetail?.product?.shop?.id,
            name: orderDetail?.product?.shop?.name,
            description: orderDetail?.product?.shop?.description,
            image: orderDetail?.product?.shop?.image,
            status: orderDetail?.product?.shop?.status,
          },
          images: orderDetail.product?.images.map((image) => image.imageUrl),
          categories: orderDetail.product.categories.map((category) => ({
            id: category.id,
            name: category.name,
            image: category.image,
            description: category.description,
          })),
        },
      })),
    };

    return formatData;
  };
}
