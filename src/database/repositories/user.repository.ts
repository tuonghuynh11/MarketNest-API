import { Request, Response } from "express";
import { User } from "../entities/User";
import { Session } from "../entities/Session";
import { UserStatus } from "../entities/Product";
import { Like } from "typeorm";
import { Role } from "../entities/Role";
import {
  ForbiddenError,
  NotAcceptableError,
  NotFoundError,
} from "../../utils/errors";
import {
  generateUniqueString,
  getHashPassword,
  getNameFromEmail,
  omit,
} from "../../utils";
import config from "../../configuration";
import { sendMail } from "../../utils/email";
import AppReport from "../entities/AppReport";

export default class UserRepository {
  static getAllUses = async (req: Request) => {
    const { dataSource } = req.app.locals;

    const { pageSize = 100, pageIndex = 1, status, searchName } = req.query;

    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find({
      skip: Number(pageSize) * (Number(pageIndex) - 1),
      take: Number(pageSize),
      where: {
        status: UserStatus[status as keyof typeof UserStatus],
        displayName: searchName ? Like(`%${searchName}%`) : undefined,
      },
    });

    const count = await userRepository.count({
      where: {
        status: UserStatus[status as keyof typeof UserStatus],
        displayName: searchName ? Like(`%${searchName}%`) : undefined,
      },
    });

    return {
      pageSize: Number(pageSize),
      pageIndex: Number(pageIndex),
      count,
      totalPages: Math.ceil(count / Number(pageSize)),
      users: users.map((user: User) => {
        const { hashPassword, resetToken, ...restUser } = user;
        return restUser;
      }),
    };
  };
  static add = async ({ req, res }: { req: Request; res: Response }) => {
    const { username, email, roleId, avatar } = req.body;
    const { session } = res.locals;
    const { dataSource, nodeMailer } = req.app.locals;
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    const usernameExist = await userRepository.findOneBy({ username });
    if (usernameExist) {
      throw new NotAcceptableError("Username already in use.");
    }

    const emailExist = await userRepository.findOneBy({ email });
    if (emailExist) {
      throw new NotAcceptableError("Email already in use.");
    }

    const roleExist = await roleRepository.findOneBy({ id: roleId });
    if (!roleExist) {
      throw new NotFoundError("Role is not found.");
    }
    // TODO: send mail
    const activeToken = generateUniqueString();

    const urlActive = `${config.clientSite}/auth/active-account/${activeToken}`;
    await sendMail({
      nodeMailer,
      emails: email,
      template: "ActiveAccount",
      data: {
        subject: "Activate Your Account and Start Shopping Today!",
        email,
        displayName: getNameFromEmail(email),
        urlActive,
        contactEmail: "",
        websiteUrl: "",
        logoUrl:
          "https://marketplace.canva.com/EAGHpqF4xz0/1/0/1600w/canva-purple-%26-yellow-illustrative-e-commerce-online-shop-logo-PzcxxJfRApQ.jpg",
      },
    });

    const user = userRepository.create({
      username,
      email,
      hashPassword: getHashPassword(generateUniqueString(12)),
      activeToken,
      displayName: getNameFromEmail(email),
      avatar,
      role: roleExist,
      createdBy: session.userId,
    });
    await userRepository.save(user);

    return {
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
    };
  };
  static sendAppReport = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { title, content, image } = req.body;
    const { session } = res.locals;
    const { dataSource } = req.app.locals;
    const appReportRepository = dataSource.getRepository(AppReport);
    const userRepository = dataSource.getRepository(User);

    const [admin, sender] = await Promise.all([
      userRepository.findOneBy({ id: "1474b621-6051-4ef4-b7ba-2e5eacb704fb" }),
      userRepository.findOneBy({ id: session.userId }),
    ]);

    const newAppReport = new AppReport();
    newAppReport.title = title;
    newAppReport.body = content;
    newAppReport.sender = sender!;
    newAppReport.receiver = admin!;
    newAppReport.image = image;
    newAppReport.createdBy = session.userId;

    await appReportRepository.save(newAppReport);

    return newAppReport;
  };
  static resendActiveEmail = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { session } = res.locals;
    const { dataSource, nodeMailer } = req.app.locals;
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOneBy({ id: session.userId });

    if (!user) {
      throw new NotFoundError("User is not found.");
    }

    // TODO: send mail
    const activeToken = generateUniqueString();
    const urlActive = `${config.clientSite}/auth/active-account/${activeToken}`;
    await sendMail({
      nodeMailer,
      emails: user.email,
      template: "ActiveAccount",
      data: {
        subject: "Activate Your Account and Start Shopping Today!",
        email: user.email,
        displayName: getNameFromEmail(user.email),
        urlActive,
        contactEmail: "",
        websiteUrl: "",
        logoUrl:
          "https://marketplace.canva.com/EAGHpqF4xz0/1/0/1600w/canva-purple-%26-yellow-illustrative-e-commerce-online-shop-logo-PzcxxJfRApQ.jpg",
      },
    });

    userRepository.merge(user, { activeToken });
    await userRepository.save(user);
  };

  static getUserById = async (req: Request) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({
      relations: ["role"],
      where: { id },
    });

    if (!user) {
      throw new NotFoundError("User is not found.");
    }
    return {
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
    };
  };

  static update = async (req: Request) => {
    const { id } = req.params;
    const { username, email, status, displayName, roleId, avatar } = req.body;
    const { dataSource } = req.app.locals;
    const userRepository = dataSource.getRepository(User);
    const sessionRepository = dataSource.getRepository(Session);
    const roleRepository = dataSource.getRepository(Role);

    const user = await userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundError("User is not found.");
    }

    if (username) {
      const usernameExist = await userRepository.findOneBy({ username });
      if (usernameExist && usernameExist.id !== id) {
        throw new NotAcceptableError("Username already in use.");
      }
    }

    if (email) {
      const emailExist = await userRepository.findOneBy({ email });
      if (emailExist && emailExist.id !== id) {
        throw new NotAcceptableError("Email already in use.");
      }
    }

    let roleExist: Role | null = null;
    if (roleId) {
      roleExist = await roleRepository.findOneBy({ id: roleId });
      if (!roleExist) {
        throw new NotAcceptableError("Role is not found.");
      }
    }

    if (status) {
      if (status === UserStatus.DISABLED) {
        //Delete all session If user is disabled
        await sessionRepository.delete({
          email: user.email,
        });
      }

      userRepository.merge(user, {
        username,
        email,
        status,
        displayName,
        role: roleExist == null ? undefined : roleExist,
        avatar,
      });
    }
    await userRepository.save(user);
    return {
      user: omit(user, ["hashPassword", "resetToken", "activeToken"]),
    };
  };

  static softDelete = async (req: Request) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;

    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundError("User is not found.");
    }

    if (user.createdBy === "migration") {
      throw new ForbiddenError("Can not delete this User.");
    }
    await userRepository.softDelete({ id });
  };
  static hardDelete = async (req: Request) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;

    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundError("User is not found.");
    }

    if (user.createdBy === "migration") {
      throw new ForbiddenError("Can not delete this User.");
    }

    await userRepository.remove(user);
  };
}
