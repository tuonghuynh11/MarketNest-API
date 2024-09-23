import AuthController from "../controllers/auth.controller";
import MediaController from "../controllers/media.controller";
import RoleController from "../controllers/role.controller";
import UserController from "../controllers/user.controller";

export const appRouters = [
  {
    rootPath: "/api/v1",
    controllers: [
      AuthController,
      RoleController,
      UserController,
      MediaController,
    ],
  },
];
