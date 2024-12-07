import { User } from "../entities/User";
import { Request, Response } from "express";
import { Role } from "../entities/Role";
import { Session } from "../entities/Session";

import {
  generateUniqueString,
  getAccessToken,
  getHashPassword,
  getNameFromEmail,
  getRefreshToken,
  omit,
  validateEmail,
  validatePassword,
} from "../../utils";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors";
import { sendMail } from "../../utils/email";
import config from "../../configuration";
import { UserStatus } from "../entities/User";
import { compareSync } from "bcryptjs";
import { verify } from "jsonwebtoken";
import { Shop } from "../entities/Shop";
import ShopRepository from "./shop.repository";

export default class AuthRepository {
  static getRoleByUser = async ({ dataSource, userId }: any) => {
    const userRepository = dataSource.getRepository(User);

    const user: User | null = await userRepository.findOne({
      relations: ["role"],
      where: { id: userId },
    });

    return {
      role: user?.role?.name,
    };
  };

  static register = async (req: Request) => {
    const { email, password, userName } = req.body;
    const { dataSource, nodeMailer } = req.app.locals;
    const userRepository = dataSource.getRepository(User);
    const sessionRepository = dataSource.getRepository(Session);
    const roleRepository = dataSource.getRepository(Role);

    // validate
    if (!(email && validateEmail(email))) {
      throw new BadRequestError("Please enter an valid email address.");
    }
    const existEmail = await userRepository.findOneBy({ email });
    const existUserName = await userRepository.findOneBy({
      username: userName,
    });
    if (existEmail) {
      throw new BadRequestError("The email already exists.");
    }
    if (existUserName) {
      throw new BadRequestError("The username already exists.");
    }
    if (!password) {
      throw new BadRequestError("Please enter your password.");
    }
    if (password && !validatePassword(password)) {
      throw new BadRequestError("Password does not meet requirements.");
    }
    const userRole: Role | null = await roleRepository.findOneBy({
      name: "User",
    });
    const activeToken = generateUniqueString();

    const user = userRepository.create({
      email,
      hashPassword: getHashPassword(password),
      activeToken: activeToken,
      createdBy: "",
      username: userName,
      role: userRole!,
    });

    // TODO: send mail
    const urlActive = `${config.clientSite}/auth/active-account/${activeToken}`;
    await sendMail({
      nodeMailer,
      emails: user.email,
      template: "ActiveAccount",
      data: {
        subject: "Activate Your Account and Start Shopping Today!",
        email: user.email,
        displayName: getNameFromEmail(email),
        urlActive,
        contactEmail: "",
        websiteUrl: "",
        logoUrl:
          "https://marketplace.canva.com/EAGHpqF4xz0/1/0/1600w/canva-purple-%26-yellow-illustrative-e-commerce-online-shop-logo-PzcxxJfRApQ.jpg",
      },
    });
    await userRepository.save(user);

    //Create a session
    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const session: Session = sessionRepository.create({
      user,
      email: user.email,
      accessToken,
      refreshToken,
      userAgent: req.get("User-Agent"),
    } as Session);

    await sessionRepository.save(session);
    const rolePermission = await AuthRepository.getRoleByUser({
      dataSource,
      userId: user.id,
    });
    return {
      accessToken,
      refreshToken,
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
      session: {
        userId: user.id,
        ...rolePermission,
        accessToken: session.accessToken,
      },
    };
  };
  static activeAccount = async (req: Request) => {
    const { activeToken } = req.body;
    const { dataSource } = req.app.locals;

    const userRepository = dataSource.getRepository(User);
    const sessionRepository = dataSource.getRepository(Session);
    const user = await userRepository.findOneBy({
      activeToken,
    });
    if (!user) {
      throw new NotFoundError("The token was not found.");
    }

    userRepository.merge(user, {
      activeToken: "",
      status: UserStatus.ACTIVE,
    });

    await userRepository.save(user);

    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const session = sessionRepository.create({
      user,
      email: user.email,
      accessToken,
      refreshToken,
      userAgent: req.get("User-Agent"),
    } as Session);

    await sessionRepository.save(session);
    const allRolePermission = await AuthRepository.getRoleByUser({
      dataSource,
      userId: user.id,
    });
    return {
      accessToken,
      refreshToken,
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
      session: {
        userId: user.id,
        ...allRolePermission,
        accessToken: session.accessToken,
      },
    };
  };
  static login = async (req: Request) => {
    const { email, password } = req.body;
    const { dataSource } = req.app.locals;
    const userRepository = dataSource.getRepository(User);
    const sessionRepository = dataSource.getRepository(Session);

    // validate
    if (!(email && validateEmail(email))) {
      throw new BadRequestError("Please enter an valid email address.");
    }
    const user = await userRepository.findOneBy({
      email,
    });

    if (!user) {
      throw new NotFoundError("Email was not found.");
    }

    const statusAbleToLogin = [UserStatus.ACTIVE, UserStatus.PENDING];
    if (!statusAbleToLogin.includes(user.status)) {
      throw new ForbiddenError(`The account is ${user.status.toLowerCase()}.`);
    }
    if (!password) {
      throw new BadRequestError("Please enter your password.");
    }
    if (!compareSync(password, user.hashPassword)) {
      throw new BadRequestError("Incorrect password. Please try again.");
    }

    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const session = sessionRepository.create({
      user,
      email: user.email,
      accessToken,
      refreshToken,
      userAgent: req.get("User-Agent"),
    } as Session);

    await sessionRepository.save(session);

    const rolePermission = await AuthRepository.getRoleByUser({
      dataSource,
      userId: user.id,
    });

    const shops = await ShopRepository.getShopByUser({
      dataSource,
      userId: user.id,
    });
    return {
      accessToken,
      refreshToken,
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
      session: {
        userId: user.id,
        ...rolePermission,
        ...shops,
        accessToken: session.accessToken,
      },
    };
  };
  static loginByGoogle = async (req: Request) => {
    const { dataSource } = req.app.locals;
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);
    const sessionRepository = dataSource.getRepository(Session);

    const { profile } = req.body;
    // Check email exist in database

    const user = await userRepository.findOneBy({
      email: profile.email,
    });
    if (!user) {
      const userRole: Role | null = await roleRepository.findOneBy({
        name: "User",
      });
      const newUser: User = userRepository.create({
        email: profile.email,
        username: profile.name,
        displayName: profile.name,
        avatar: profile.picture,
        hashPassword: getHashPassword(profile.email),
        activeToken: "",
        createdBy: "",
        role: userRole!,
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(newUser);
      const accessToken = getAccessToken(newUser.id);
      const refreshToken = getRefreshToken(newUser.id);
      const session = sessionRepository.create({
        user: newUser,
        email: newUser.email,
        accessToken,
        refreshToken,
        userAgent: req.get("User-Agent"),
      } as Session);

      await sessionRepository.save(session);

      const rolePermission = await AuthRepository.getRoleByUser({
        dataSource,
        userId: newUser.id,
      });

      return {
        accessToken,
        refreshToken,
        user: omit(newUser, ["hashPassword", "resetToken", "activeToken"]),
        session: {
          userId: newUser.id,
          ...rolePermission,
          accessToken: session.accessToken,
        },
      };
    } else {
      const accessToken = getAccessToken(user.id);
      const refreshToken = getRefreshToken(user.id);
      const session = sessionRepository.create({
        user,
        email: user.email,
        accessToken,
        refreshToken,
        userAgent: req.get("User-Agent"),
      } as Session);

      await sessionRepository.save(session);

      const rolePermission = await AuthRepository.getRoleByUser({
        dataSource,
        userId: user.id,
      });
      return {
        accessToken,
        refreshToken,
        user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
        session: {
          userId: user.id,
          ...rolePermission,
          accessToken: session.accessToken,
        },
      };
    }
  };

  // static googleLogin = async (req: Request) => {
  //   const { dataSource } = req.app.locals;
  //   const userRepository = dataSource.getRepository(User);
  //   const roleRepository = dataSource.getRepository(Role);
  //   const sessionRepository = dataSource.getRepository(Session);

  //   const { code } = req.query;
  //   const data: any = await getOauthGooleToken(code as string); // Gửi authorization code để lấy Google OAuth token

  //   const { id_token, access_token } = data; // Lấy ID token và access token từ kết quả trả về
  //   const googleUser = await getGoogleUser({ id_token, access_token }); // Gửi Google OAuth token để lấy thông tin người dùng từ Google

  //   // Kiểm tra email đã được xác minh từ Google
  //   if (!googleUser.verified_email) {
  //     throw new ForbiddenError("Google email not verified");
  //   }

  //   // Check email exist in database

  //   const user = await userRepository.findOneBy({
  //     email: googleUser.email,
  //   });
  //   if (!user) {
  //     const userRole: Role | null = await roleRepository.findOneBy({
  //       name: "User",
  //     });
  //     const newUser: User = userRepository.create({
  //       email: googleUser.email,
  //       username: googleUser.name,
  //       displayName: googleUser.name,
  //       avatar: googleUser.picture,
  //       hashPassword: getHashPassword(googleUser.email),
  //       activeToken: "",
  //       createdBy: "",
  //       role: userRole!,
  //       status: UserStatus.ACTIVE,
  //     });
  //     await userRepository.save(newUser);
  //     const accessToken = getAccessToken(newUser.id);
  //     const refreshToken = getRefreshToken(newUser.id);
  //     const session = sessionRepository.create({
  //       user: newUser,
  //       email: newUser.email,
  //       accessToken,
  //       refreshToken,
  //       userAgent: req.get("User-Agent"),
  //     } as Session);

  //     await sessionRepository.save(session);

  //     const rolePermission = await AuthRepository.getRoleByUser({
  //       dataSource,
  //       userId: newUser.id,
  //     });
  //     return {
  //       accessToken,
  //       refreshToken,
  //       user: omit(newUser, ["hashPassword", "resetToken", "activeToken"]),
  //       session: {
  //         userId: newUser.id,
  //         ...rolePermission,
  //         accessToken: session.accessToken,
  //       },
  //     };
  //   } else {
  //     const accessToken = getAccessToken(user.id);
  //     const refreshToken = getRefreshToken(user.id);
  //     const session = sessionRepository.create({
  //       user,
  //       email: user.email,
  //       accessToken,
  //       refreshToken,
  //       userAgent: req.get("User-Agent"),
  //     } as Session);

  //     await sessionRepository.save(session);

  //     const rolePermission = await AuthRepository.getRoleByUser({
  //       dataSource,
  //       userId: user.id,
  //     });
  //     return {
  //       accessToken,
  //       refreshToken,
  //       user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
  //       session: {
  //         userId: user.id,
  //         ...rolePermission,
  //         accessToken: session.accessToken,
  //       },
  //     };
  //   }
  // };
  static refresh = async (req: Request) => {
    const { __refreshToken: refToken } = req.cookies;
    const { dataSource } = req.app.locals;

    verify(refToken, config.jwtRefreshKey);

    const sessionRepository = dataSource.getRepository(Session);
    const session = await sessionRepository.findOneBy({
      refreshToken: refToken,
    });
    if (!session) {
      throw new BadRequestError("Session was not found.");
    }
    const newToken = getAccessToken(session.user.id);
    session.accessToken = newToken;
    const results = await sessionRepository.save(session);

    const rolePermission = await AuthRepository.getRoleByUser({
      dataSource,
      userId: session.user.id,
    });
    return {
      session: {
        userId: session.user.id,
        ...rolePermission,
        accessToken: results.accessToken,
      },
    };
  };
  static setPassword = async (req: Request) => {
    const { password, resetToken } = req.body;
    const { dataSource } = req.app.locals;

    const userRepository = dataSource.getRepository(User);
    const sessionRepository = dataSource.getRepository(Session);
    const user = await userRepository.findOneBy({
      resetToken,
    });
    if (!user) {
      throw new NotFoundError("The token was not found.");
    }

    if (!password) {
      throw new BadRequestError("Please enter your password.");
    }
    if (password && !validatePassword(password)) {
      throw new BadRequestError("Password does not meet requirements.");
    }

    userRepository.merge(user, {
      hashPassword: getHashPassword(password),
      resetToken: "",
    });

    await userRepository.save(user);

    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const session = sessionRepository.create({
      user,
      email: user.email,
      accessToken,
      refreshToken,
      userAgent: req.get("User-Agent"),
    } as Session);

    await sessionRepository.save(session);
    const rolePermission = await AuthRepository.getRoleByUser({
      dataSource,
      userId: user.id,
    });
    return {
      accessToken,
      refreshToken,
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
      session: {
        userId: user.id,
        ...rolePermission,
        accessToken: session.accessToken,
      },
    };
  };
  static changePassword = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { newPassword } = req.body;
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const userRepository = dataSource.getRepository(User);

    const decode: any = verify(session.accessToken, config.jwtAccessKey);

    const user = await userRepository.findOneBy({
      id: decode.iss,
    });

    if (!user) {
      throw new BadRequestError("User not found");
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError("User not active");
    }

    user.hashPassword = getHashPassword(newPassword);
    await userRepository.save(user);
  };
  static getMe = async ({ req, res }: { req: Request; res: Response }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    verify(session.accessToken, config.jwtAccessKey);
    const userRepository = dataSource.getRepository(User);
    const shopRepository = dataSource.getRepository(Shop);

    const user: User | null = await userRepository.findOneBy({
      id: session.userId,
    });
    if (!user) {
      throw new NotFoundError("User account is not found.");
    }

    const shop = await shopRepository.findOneBy({
      owner: {
        id: session.userId,
      },
    });

    return {
      user: {
        ...omit(user, ["hashPassword", "resetToken", "activeToken"]),
        shop,
      },
    };
  };
}
