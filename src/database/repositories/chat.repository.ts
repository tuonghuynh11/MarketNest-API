import { Request, Response } from "express";
import { FindManyOptions } from "typeorm";
import { NotFoundError } from "../../utils/errors";
import { Shop } from "../entities/Shop";
import { User } from "../entities/User";
import ChatRoom from "../entities/ChatRoom";
import ChatDetail from "../entities/ChatDetail";

export default class ChatRepository {
  static getForShopkeeper = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const { pageSize, pageIndex, sortBy, orderBy } = req.query;

    const shopRepository = dataSource.getRepository(Shop);
    const chatRoomRepository = dataSource.getRepository(ChatRoom);
    const chatDetailRepository = dataSource.getRepository(ChatDetail);

    const shop = await shopRepository.findOne({
      relations: {
        owner: true,
      },
      where: {
        owner: {
          id: session.userId,
        },
      },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found.");
    }

    let criteria: FindManyOptions<ChatRoom> = {
      relations: {
        user: true,
        shop: {
          owner: true,
        },
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        user: {
          id: true,
          username: true,
          avatar: true,
        },
        shop: {
          id: true,
          name: true,
        },
        id: true,
        title: true,
      },
      where: {
        shop: {
          id: shop.id,
        },
      },
    };

    if (sortBy) {
      criteria = {
        ...criteria,
        order: {
          [sortBy as string]: orderBy,
        },
      };
    }

    const [chatsRooms, count] = await chatRoomRepository.findAndCount(criteria);

    const chatDetails = await Promise.all(
      chatsRooms.map((chatRoom: ChatRoom) => {
        return chatDetailRepository.findOne({
          relations: {
            chatRoom: true,
          },
          where: {
            chatRoom: {
              id: chatRoom.id,
            },
          },
          order: {
            createdAt: "DESC",
          },
        });
      })
    );

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      chatsRooms: chatsRooms.map((chatRoom: ChatRoom, index: number) => {
        return {
          ...chatRoom,
          lastMessage: chatDetails[index] ? chatDetails[index] : null,
        };
      }),
    };
  };
  static getForUser = async ({ req, res }: { req: Request; res: Response }) => {
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const { pageSize, pageIndex, sortBy, orderBy } = req.query;

    const userRepository = dataSource.getRepository(User);
    const chatRoomRepository = dataSource.getRepository(ChatRoom);
    const chatDetailRepository = dataSource.getRepository(ChatDetail);

    const user = await userRepository.findOne({
      where: { id: session.userId },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    let criteria: FindManyOptions<ChatRoom> = {
      relations: {
        user: true,
        shop: {
          owner: true,
        },
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        user: {
          id: true,
          username: true,
          avatar: true,
        },
        shop: {
          id: true,
          name: true,
          image: true,
        },
        id: true,
        title: true,
      },
      where: {
        user: {
          id: user.id,
        },
      },
    };

    if (sortBy) {
      criteria = {
        ...criteria,
        order: {
          [sortBy as string]: orderBy,
        },
      };
    }

    const [chatsRooms, count] = await chatRoomRepository.findAndCount(criteria);

    const chatDetails = await Promise.all(
      chatsRooms.map((chatRoom: ChatRoom) => {
        return chatDetailRepository.findOne({
          relations: {
            chatRoom: true,
          },
          where: {
            chatRoom: {
              id: chatRoom.id,
            },
          },
          order: {
            createdAt: "DESC",
          },
        });
      })
    );

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      chatsRooms: chatsRooms.map((chatRoom: ChatRoom, index: number) => {
        return {
          ...chatRoom,
          lastMessage: chatDetails[index] ? chatDetails[index] : null,
        };
      }),
    };
  };

  static getById = async ({ req, res }: { req: Request; res: Response }) => {
    const { id } = req.params;
    const { dataSource } = req.app.locals;
    const chatRoomsRepository = dataSource.getRepository(ChatRoom);

    const chatRoom = await chatRoomsRepository.findOne({
      relations: {
        chatDetails: {
          sender: true,
        },
      },
      where: { id },
      select: {
        chatDetails: {
          sender: {
            id: true,
            username: true,
            avatar: true,
          },
          id: true,
          image: true,
          message: true,
          createdAt: true,
          isRead: true,
        },
      },
    });

    console.log("Chat Details", chatRoom);

    if (!chatRoom) {
      throw new NotFoundError("Chat room not found.");
    }

    const chatDetails = chatRoom.chatDetails.sort(
      (a: ChatDetail, b: ChatDetail) =>
        b.createdAt.getTime() - a.createdAt.getTime()
    );
    return chatDetails;
  };

  static create = async ({ req, res }: { req: Request; res: Response }) => {
    const { userId, shopId, title } = req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const chatRoomRepository = dataSource.getRepository(ChatRoom);
    const shopRepository = dataSource.getRepository(Shop);
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const shop = await shopRepository.findOneBy({ id: shopId });
    if (!shop) {
      throw new NotFoundError("Shop not found.");
    }

    const chatRoomExists = await chatRoomRepository.findOne({
      where: {
        user: { id: userId },
        shop: { id: shopId },
      },
    });

    if (chatRoomExists) {
      return chatRoomExists;
    }
    const chatRoom = chatRoomRepository.create({
      createdBy: session.userId,
      user,
      shop,
      title,
    });

    await chatRoomRepository.save(chatRoom);

    return chatRoom;
  };

  static send = async ({ req, res }: { req: Request; res: Response }) => {
    const { senderId, chatRoomId, image, message } = req.body;
    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const userRepository = dataSource.getRepository(User);
    const chatRoomRepository = dataSource.getRepository(ChatRoom);
    const chatDetailRepository = dataSource.getRepository(ChatDetail);

    const chatRoom = await chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    if (!chatRoom) {
      throw new NotFoundError("Chat Room not found.");
    }

    const user = await userRepository.findOne({
      where: { id: senderId },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const newMessage = chatDetailRepository.create({
      createdBy: session.userId,
      sender: user,
      image,
      message,
      chatRoom,
    });
    await chatDetailRepository.save(newMessage);
    return newMessage;
  };
}
