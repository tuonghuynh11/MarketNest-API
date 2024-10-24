import { Request, Response } from "express";
import Order from "../entities/Order";
import { NotAcceptableError } from "../../utils/errors";
import { omit } from "../../utils";
import OrderDetail from "../entities/OrderDetail";
import { OrderStatus, SystemRole } from "../../utils/enums";
import PaymentMethod from "../entities/PaymentMethod";
import ShippingMethod from "../entities/ShippingMethod";
import Address from "../entities/Address";
import Discount from "../entities/Discount";
import { Shop } from "../entities/Shop";
import { Product } from "../entities/Product";
import { In } from "typeorm";

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
        "shop",
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
      shop: {
        id: order.shop?.id,
        name: order.shop?.name,
        description: order.shop?.description,
        image: order.shop?.image,
        status: order.shop?.status,
      },
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

  static createOrder = async ({
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
    const paymentMethodRepository = dataSource.getRepository(PaymentMethod);
    const shippingMethodRepository = dataSource.getRepository(ShippingMethod);
    const addressRepository = dataSource.getRepository(Address);
    const discountRepository = dataSource.getRepository(Discount);
    const shopRepository = dataSource.getRepository(Shop);
    const productRepository = dataSource.getRepository(Product);

    const {
      paymentMethodId,
      shippingMethodId,
      addressId,
      discountId,
      orderDetails,
      shopId,
      shippingFee,
      totalAmount,
    } = req.body;

    const paymentMethod = await paymentMethodRepository.findOneBy({
      id: paymentMethodId,
    });
    if (!paymentMethod) {
      throw new NotAcceptableError("Payment method not found");
    }

    const shippingMethod = await shippingMethodRepository.findOneBy({
      id: shippingMethodId,
    });
    if (!shippingMethod) {
      throw new NotAcceptableError("Shipping method not found");
    }

    const address = await addressRepository.findOneBy({
      id: addressId,
    });
    if (!address) {
      throw new NotAcceptableError("Address not found");
    }

    const shop = await shopRepository.findOneBy({
      id: shopId,
    });
    if (!shop) {
      throw new NotAcceptableError("Shop not found");
    }

    if (discountId) {
      const discount = await discountRepository.findOneBy({
        id: discountId,
      });
      if (!discount) {
        throw new NotAcceptableError("Discount not found");
      }
    }

    const products = await productRepository.find({
      where: {
        id: In(orderDetails.map((item: any) => item.productId)),
      },
    });

    const isOutOfStock = products.some(
      (product: Product, index: number) =>
        product.stock < orderDetails[index].quantity
    );

    if (isOutOfStock) {
      throw new NotAcceptableError("Product is out of stock");
    }

    const order = orderRepository.create({
      paymentMethod: paymentMethodId,
      shippingMethod: shippingMethodId,
      address: addressId,
      discount: discountId ? discountId : null,
      user: session.userId,
      createdBy: session.userId,
      shop: shopId,
      shippingFee,
      totalAmount,
      orderStatus: OrderStatus.WAITING_VERIFY,
    });

    const orderDetailsEntities = orderDetails.map((orderDetail: any) => {
      const orderDetailEntity = orderDetailRepository.create({
        product: orderDetail.productId,
        quantity: orderDetail.quantity,
        price: orderDetail.price,
        createdBy: session.userId,
      });

      return orderDetailEntity;
    });

    await Promise.all(
      orderDetails.map((orderDetail: any) => {
        return productRepository.query(
          `UPDATE products SET stock = stock - ${orderDetail.quantity} WHERE id = '${orderDetail.productId}'`
        );
      })
    );

    const savedOrder = await orderRepository.save(order);
    await orderDetailRepository.save(
      orderDetailsEntities.map((orderDetail: OrderDetail) => {
        orderDetail.order = savedOrder;
        return orderDetail;
      })
    );

    return savedOrder;
  };
}
