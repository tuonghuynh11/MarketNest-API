import AuthController from "../controllers/auth.controller";
import CartController from "../controllers/cart.controller";
import CategoryController from "../controllers/category.controller";
import MediaController from "../controllers/media.controller";
import OrderController from "../controllers/order.controller";
import ProductController from "../controllers/product.controller";
import PublicController from "../controllers/public.controller";
import RoleController from "../controllers/role.controller";
import ShopkeeperController from "../controllers/shopkeeper.controller";
import UserController from "../controllers/user.controller";
import WishListController from "../controllers/wishlist.controller";

export const appRouters = [
  {
    rootPath: "/api/v1",
    controllers: [
      AuthController,
      RoleController,
      UserController,
      MediaController,
      OrderController,
      ShopkeeperController,
      CartController,
      CategoryController,
      ProductController,
      WishListController,
      PublicController,
    ],
  },
];
