import AdminController from "../controllers/admin.controller";
import AuthController from "../controllers/auth.controller";
import CartController from "../controllers/cart.controller";
import CategoryController from "../controllers/category.controller";
import ChatController from "../controllers/chat.controller";
import DiscountController from "../controllers/discount.controller";
import MediaController from "../controllers/media.controller";
import OrderController from "../controllers/order.controller";
import PaymentController from "../controllers/payment.controller";
import ProductController from "../controllers/product.controller";
import PublicController from "../controllers/public.controller";
import RatingController from "../controllers/rating.controller";
import RefundRequestController from "../controllers/refundRequest.controller";
import ReportController from "../controllers/report.controller";
import RoleController from "../controllers/role.controller";
import ShopController from "../controllers/shop.controller";
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
      PaymentController,
      RefundRequestController,
      DiscountController,
      ShopController,
      ChatController,
      AdminController,
      RatingController,
      ReportController,
    ],
  },
];
