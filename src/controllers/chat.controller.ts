import { NextFunction, Request, Response } from "express";
import Authenticate from "../decorators/authenticate";
import Authorize from "../decorators/authorize";
import Controller from "../decorators/controller";
import { Get, Post, Put } from "../decorators/handlers";
import { SystemRole } from "../utils/enums";
import ChatRepository from "../database/repositories/chat.repository";
import ChatDetail from "../database/entities/ChatDetail";

Authenticate();
@Controller("/chats")
export default class ChatController {
  @Post("/")
  @Authorize([SystemRole.Shopkeeper, SystemRole.User])
  public async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ChatRepository.create({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }
  @Post("/send")
  @Authorize([SystemRole.Shopkeeper, SystemRole.User])
  public async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ChatRepository.send({ req, res });
      res.locals.data = response;
      next();
    } catch (error) {
      next(error);
    }
  }

  @Get("/shopkeeper")
  @Authorize([SystemRole.Shopkeeper])
  public async getForShopkeeper(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ChatRepository.getForShopkeeper({ req, res });
      res.locals.data = {
        chat_rooms: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Get("/user")
  @Authorize([SystemRole.User])
  public async getForUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ChatRepository.getForUser({ req, res });
      res.locals.data = {
        chat_rooms: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }
  @Get("/chat-rooms/:id")
  @Authorize([SystemRole.Shopkeeper, SystemRole.User])
  public async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await ChatRepository.getById({ req, res });
      res.locals.data = {
        chatDetails: response,
      };

      next();
    } catch (error) {
      next(error);
    }
    next();
  }

  @Put("/read/:chat_detail_id")
  @Authorize([SystemRole.Shopkeeper, SystemRole.User])
  public async read(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { dataSource } = req.app.locals;
      const { chat_detail_id } = req.params;

      const chatDetailRepository = dataSource.getRepository(ChatDetail);

      await chatDetailRepository
        .createQueryBuilder()
        .update(ChatDetail)
        .set({ isRead: true })
        .where({ id: chat_detail_id })
        .execute();

      next();
    } catch (error) {
      next(error);
    }
  }
}
