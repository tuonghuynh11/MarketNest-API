import { Request } from "express";
import { Role } from "../entities/Role";
import { Like } from "typeorm";

export default class RoleRepository {
  static getAllRoles = async (req: Request) => {
    const { pageSize = 100, pageIndex = 1, searchName } = req.query;
    const { dataSource } = req.app.locals;
    const roleRepository = dataSource.getRepository(Role);

    const roles = await roleRepository.find({
      skip: Number(pageSize) * (Number(pageIndex) - 1),
      take: Number(pageSize),
      where: {
        name: searchName ? Like(`%${searchName}%`) : undefined,
      },
    });

    const count = await roleRepository.count({
      where: {
        name: searchName ? Like(`%${searchName}%`) : undefined,
      },
    });

    return {
      pageSize: Number(pageSize),
      pageIndex: Number(pageIndex),
      count,
      totalPages: Math.ceil(count / Number(pageSize)),
      roles: roles,
    };
  };
}
