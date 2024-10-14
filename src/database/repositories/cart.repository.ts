import { Request, Response } from "express";
import Cart from "../entities/Cart";
import { NotFoundError } from "../../utils/errors";
import { Product } from "../entities/Product";
import CartDetail from "../entities/CartDetail";

export default class CartRepository {
  static getCart = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const cartRepository = dataSource.getRepository(Cart);
    const cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["cartDetails", "cartDetails.product"],
    });
    if (!cart) {
      throw new NotFoundError("Cart not found.");
    }
    return {
      cart,
    };
  };
  static addToCart = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const { productId, quantity } = req.body;
    const cartRepository = dataSource.getRepository(Cart);
    const productRepository = dataSource.getRepository(Product);
    const cartDetailRepository = dataSource.getRepository(CartDetail);

    let cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["cartDetails", "cartDetails.product"],
    });
    if (!cart) {
      cart = cartRepository.create({
        user: { id: userId },
        cartDetails: [],
      });
      await cartRepository.save(cart);
    }

    const product = await productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundError("Product not found.");
    }
    let cartDetail = cart.cartDetails.find(
      (detail: CartDetail) => detail.product.id === productId
    );

    if (cartDetail) {
      cartDetail.quantity = cartDetail.quantity +  parseInt(quantity);
    } else {
      cartDetail = cartDetailRepository.create({
        product,
        cart,
        quantity,
      });
      cart.cartDetails.push(cartDetail);
    }
    await cartDetailRepository.save(cartDetail);
    await cartRepository.save(cart);
    
    return {
      message: "Added to cart successfully.",
      cart,
    };
  };
  static updateCartQuantity = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const { productId, quantity } = req.body;
    const cartRepository = dataSource.getRepository(Cart);
    const cartDetailRepository = dataSource.getRepository(CartDetail);

    const cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["cartDetails", "cartDetails.product"],
    });
  
    if (!cart) {
      throw new NotFoundError("Cart not found.");
    }

    const cartDetail = cart.cartDetails.find(
      (detail: CartDetail) => detail.product.id === productId
    );
  
    if (!cartDetail) {
      throw new NotFoundError("Product not found in the cart.");
    }

    cartDetail.quantity = parseInt(quantity);
  
    await cartDetailRepository.save(cartDetail);

    return {
      message: "Cart quantity updated successfully.",
      cart,
    };
  }
  static removeFromCart = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const { productId } = req.body;
    const cartRepository = dataSource.getRepository(Cart);
    const cartDetailRepository = dataSource.getRepository(CartDetail);

    const cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["cartDetails", "cartDetails.product"],
    });

    if (!cart) {
      throw new NotFoundError("Cart not found.");
    }

    const cartDetail = cart.cartDetails.find(
      (detail: CartDetail) => detail.product.id === productId
    );

    if (!cartDetail) {
      throw new NotFoundError("Product not found in the cart.");
    }

    await cartDetailRepository.remove(cartDetail);

    cart.cartDetails = cart.cartDetails.filter((detail: CartDetail) => detail.id !== cartDetail.id);
    await cartRepository.save(cart);
    
    return {
      message: "Product removed from cart successfully.",
      cart: {
        id: cart.id,
        user: cart.user,
        cartDetails: cart.cartDetails,
      },
    };
  }
  static clearCart = async (req: Request, res: Response) => {
    const { dataSource } = req.app.locals;
    const { userId } = res.locals.session;
    const cartRepository = dataSource.getRepository(Cart);
    const cartDetailRepository = dataSource.getRepository(CartDetail);
  
    const cart = await cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ["cartDetails"],
    });
  
    if (!cart) {
      throw new NotFoundError("Cart not found.");
    }
  
    await cartDetailRepository.remove(cart.cartDetails);
  
    cart.cartDetails = [];

    await cartRepository.save(cart);
  
    return {
      message: "Cart cleared successfully.",
      cart,
    };
  };
}
