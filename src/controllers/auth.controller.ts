import { NextFunction, Request, Response } from "express";
import Controller from "../decorators/controller";
import { Delete, Get, Post, Put } from "../decorators/handlers";
import { NotFoundError } from "../utils/errors";
import { User } from "../database/entities/User";
import { generateUniqueString } from "../utils";
import config from "../configuration";
import { sendMail } from "../utils/email";
import AuthRepository from "../database/repositories/auth.repository";

@Controller("/")
export default class AuthController {
  @Post("/register")
  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.register(req);
      res.cookie("__refreshToken", response.refreshToken, { httpOnly: true });
      res.locals.data = {
        user: response.user,
      };
      res.locals.session = response.session;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/active-account")
  public async activeAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.activeAccount(req);
      res.cookie("__refreshToken", response.refreshToken, { httpOnly: true });
      res.locals.data = {
        user: response.user,
      };
      res.locals.session = response.user;
      res.redirect(config.clientSite);
      // next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/login")
  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.login(req);
      res.cookie("__refreshToken", response.refreshToken, { httpOnly: true });
      res.locals.data = { user: response.user };
      res.locals.session = response.session;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/login-google")
  public async loginByGoogleFrontend(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.loginByGoogle(req);
      res.cookie("__refreshToken", response.refreshToken, { httpOnly: true });
      res.locals.data = { user: response.user };
      res.locals.session = response.session;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Post("/refresh")
  public async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.refresh(req);
      res.locals.session = response.session;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Post("/forgot-password")
  public async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const { dataSource, nodeMailer } = req.app.locals;

      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOneBy({
        email,
      });
      if (!user) {
        throw new NotFoundError("The email was not found.");
      }

      // TODO: send mail
      const resetToken = generateUniqueString();
      const urlReset = `${config.clientSite}/auth/new-password/${resetToken}`;
      sendMail({
        nodeMailer,
        emails: user.email,
        template: "ForgotPassword",
        data: {
          subject: "A request change password",
          email: user.email,
          urlReset,
        },
      });

      userRepository.merge(user, {
        resetToken,
      });
      await userRepository.save(user);

      next();
    } catch (error) {
      next(error);
    }
  }

  @Post("/new-password")
  public async setPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.setPassword(req);
      res.cookie("__refreshToken", response.refreshToken, { httpOnly: true });
      res.locals.data = {
        user: response.user,
      };
      res.locals.session = response.session;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/change-password")
  public async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AuthRepository.changePassword({ req, res });
      res.locals.message = "Change password successfully";
      res.locals.session = null;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/me")
  public async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.getMe({ req, res });
      res.locals.message = "Get user information successfully.";
      res.locals.data = response.user;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Put("/me")
  public async updateMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.updateMe({ req, res });
      res.locals.message = "Update user information successfully.";
      res.locals.data = response.user;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Post("/addresses")
  public async addAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.addAddress({ req, res });
      res.locals.message = "Add address successfully.";
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Put("/addresses/:id")
  public async updateAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.updateAddress({ req, res });
      res.locals.message = "Update address successfully.";
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Delete("/addresses/:id")
  public async deleteAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthRepository.deleteAddress({ req, res });
      res.locals.message = "Delete address successfully.";
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  // @Get("/oauth/google")
  // public async googleLogin(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<void> {
  //   try {
  //     const { accessToken, refreshToken, user, session } =
  //       await AuthRepository.googleLogin(req);
  //     const urlRedirect = `${
  //       config.google_client_redirect_callback
  //     }?accessToken=${accessToken}&session=${JSON.stringify(session)}`;
  //     res.cookie("__refreshToken", refreshToken, { httpOnly: true });
  //     return res.redirect(urlRedirect);
  //   } catch (error) {
  //     next(error);
  //   }
  // }
}
