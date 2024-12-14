import express, {
  Application as ExApplication,
  Handler,
  NextFunction,
  Request,
  Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "./middlewares/morgan";
import { appRouters } from "./routers";
import {
  BadRequestError,
  ForbiddenError,
  GoneError,
  InternalServerError,
  MethodNotAllowedError,
  NotAcceptableError,
  NotFoundError,
  UnauthorizedError,
} from "./utils/errors";
import { IRouter } from "./decorators/handlers";
import { MetadataKeys, SystemRole } from "./utils/enums";
import { Session } from "./database/entities/Session";
import { TokenExpiredError, verify } from "jsonwebtoken";
import config from "./configuration";
import { IAuthorize } from "./utils/interfaces";
import { initFolder } from "./utils/file";
import AuthRepository from "./database/repositories/auth.repository";
import configuration from "./configuration";

class Application {
  private readonly _instance: ExApplication;

  get instance(): ExApplication {
    return this._instance;
  }

  constructor() {
    initFolder();
    this._instance = express();
    this._instance.use(morgan);
    this._instance.use(express.json());
    this._instance.use(express.urlencoded({ extended: false }));
    this._instance.use(
      cors({
        origin: [
          configuration.clientSite,
          configuration.adminSite,
          configuration.shopkeeperSite,
        ],
        credentials: true,
      })
    );
    this._instance.use(cookieParser());
    this.middleware();
    this.registerRouters();
    this.handleErrors();
    this._instance.use(
      "/static/image",
      express.static(config.upload_image_dir)
    );
  }

  private middleware(): void {
    this._instance.use(
      async (req: Request, res: Response, next: NextFunction) => {
        res.locals.session = null;
        try {
          const { authorization } = req.headers;
          if (authorization) {
            const tmp = authorization.split(" ");
            if (tmp.length === 2 && tmp[0] === "Bearer") {
              const { dataSource } = req.app.locals;
              const sessionRepository = dataSource.getRepository(Session);
              const session = await sessionRepository.findOneBy({
                accessToken: tmp[1],
              });
              if (!session) {
                throw new GoneError("session gone");
              }
              // verify token
              const decode: any = verify(tmp[1], config.jwtAccessKey);

              const allRole = await AuthRepository.getRoleByUser({
                dataSource,
                userId: decode.iss,
              });
              res.locals.session = {
                userId: decode.iss,
                ...allRole,
                accessToken: tmp[1],
              };
            }
          }
          next();
        } catch (error) {
          console.log(error);

          next(error);
        }
      }
    );
  }

  private registerRouters(): void {
    for (let iar = 0; iar < appRouters.length; iar++) {
      const { rootPath, controllers } = appRouters[iar];
      for (let ic = 0; ic < controllers.length; ic++) {
        const controllerClass = controllers[ic];
        const controllerInstance: { [handleName: string]: Handler } =
          new controllerClass() as any;

        const basePath: string = Reflect.getMetadata(
          MetadataKeys.BASE_PATH,
          controllerClass
        );
        const authenticate: string = Reflect.getMetadata(
          MetadataKeys.AUTHENTICATE,
          controllerClass
        );
        const routers: IRouter[] = Reflect.getMetadata(
          MetadataKeys.ROUTERS,
          controllerClass
        );
        const authorizes: IAuthorize[] =
          Reflect.getMetadata(MetadataKeys.AUTHORIZE, controllerClass) || [];

        const exRouter = express.Router();

        for (let ir = 0; ir < routers.length; ir++) {
          const { method, path, handlerName } = routers[ir];
          exRouter[method](
            path,
            (req: Request, res: Response, next: NextFunction) => {
              let allowedRoles: SystemRole[] | string = authenticate;
              for (let i = 0; i < authorizes.length; i++) {
                if (authorizes[i].handlerName === handlerName) {
                  allowedRoles = authorizes[i].roles;
                }
              }
              // check role permission
              if (allowedRoles) {
                if (!res.locals?.session?.role) {
                  throw new UnauthorizedError();
                }
                const { role } = res.locals?.session;
                if (Array.isArray(allowedRoles) && role) {
                  let isMatchRolePermission = allowedRoles.find(
                    (allowedRole: SystemRole) => allowedRole === role
                  );

                  if (!isMatchRolePermission) {
                    throw new ForbiddenError();
                  }
                }
              }
              next();
            },
            controllerInstance[String(handlerName)].bind(controllerInstance),
            (req: Request, res: Response) => {
              res.json({
                status: 200,
                success: true,
                message: res.locals.message || "Success",
                data: res.locals.data || null,
                session: res.locals.session,
              });
            }
          );
        }
        this._instance.use(`${rootPath}${basePath}`, exRouter);
      }
    }
  }

  private handleErrors(): void {
    this._instance.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        let statusCode = 503;
        if (err instanceof BadRequestError) {
          statusCode = 400;
        } else if (
          err instanceof UnauthorizedError ||
          err instanceof TokenExpiredError
        ) {
          statusCode = 401;
        } else if (err instanceof ForbiddenError) {
          statusCode = 403;
        } else if (err instanceof NotFoundError) {
          statusCode = 404;
        } else if (err instanceof MethodNotAllowedError) {
          statusCode = 405;
        } else if (err instanceof NotAcceptableError) {
          statusCode = 406;
        } else if (err instanceof GoneError) {
          statusCode = 410;
        } else if (err instanceof InternalServerError) {
          statusCode = 500;
        }

        res.status(statusCode).json({
          status: statusCode,
          success: false,
          message: err.message || "Failure",
          data: null,
          session: res.locals.session,
        });
      }
    );
  }
}

export default new Application();
