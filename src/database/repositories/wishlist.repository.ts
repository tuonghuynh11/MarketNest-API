import { Request, Response } from "express";
import WishList from "../entities/WishList";
import { Product } from "../entities/Product";
import { NotFoundError } from "../../utils/errors";

export default class WishListRepository {
  static addToWishList = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const { productId } = req.body;

    const wishListRepository = dataSource.getRepository(WishList);
    const productRepository = dataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    const hasProductInWishList = await wishListRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (hasProductInWishList) {
      throw new NotFoundError("Product already in wish list.");
    }
    const wishListItem = wishListRepository.create({
      user: { id: userId },
      product,
    });
    await wishListRepository.save(wishListItem);

    return {
      message: "Product added to wishlist.",
    };
  };
  static removeFromWishList = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const { productId } = req.body;

    const wishListRepository = dataSource.getRepository(WishList);

    const wishListItem = await wishListRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (!wishListItem) {
      throw new NotFoundError("Product not found in wish list.");
    }

    await wishListRepository.remove(wishListItem);

    return {
      message: "Product removed from wishlist.",
    };
  }
  static getWishList = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const wishListRepository = dataSource.getRepository(WishList);

    const wishList = await wishListRepository.find({
      where: { user: { id: userId } },
      relations: ["product"],
    });

    return {
      wishList,
    };
  }
}
