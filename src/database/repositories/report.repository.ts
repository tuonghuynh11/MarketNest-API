import { Request, Response } from "express";
import { Equal, FindManyOptions, In, IsNull, Not } from "typeorm";
import { NotFoundError } from "../../utils/errors";
import { User } from "../entities/User";
import { SystemRole } from "../../utils/enums";
import AppReport from "../entities/AppReport";
import { Role } from "../entities/Role";
import { Shop } from "../entities/Shop";

export default class ReportRepository {
  static getAllAppReport = async (req: Request) => {
    const { dataSource } = req.app.locals;
    const {
      pageSize,
      pageIndex,
      sortBy = "createdAt",
      orderBy = "DESC",
    } = req.query;

    const reportRepository = dataSource.getRepository(AppReport);

    let criteria: FindManyOptions<AppReport> = {
      relations: {
        sender: true,
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        id: true,
        title: true,
        body: true,
        image: true,
        isRead: true,
        createdAt: true,
        createdBy: true,
        sender: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      },
      where: {
        shop: IsNull(),
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

    const [appReports, count] = await reportRepository.findAndCount(criteria);

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      appReports,
    };
  };
  static getAllShopReport = async (req: Request) => {
    const { dataSource } = req.app.locals;

    const {
      pageSize,
      pageIndex,
      sortBy = "createdAt",
      orderBy = "DESC",
      shopId,
    } = req.query;

    const reportRepository = dataSource.getRepository(AppReport);

    let criteria: FindManyOptions<AppReport> = {
      relations: {
        sender: true,
        shop: true,
      },
      skip:
        pageSize && pageIndex
          ? Number(pageSize) * (Number(pageIndex) - 1)
          : undefined,
      take: pageSize && pageIndex ? Number(pageSize) : undefined,
      select: {
        id: true,
        title: true,
        body: true,
        image: true,
        isRead: true,
        createdAt: true,
        createdBy: true,
        sender: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
        shop: {
          id: true,
          name: true,
          description: true,
          image: true,
        },
      },
      where: {
        shop: Not(IsNull()),
      },
    };

    if (shopId) {
      criteria = {
        ...criteria,
        where: {
          ...criteria.where,
          shop: {
            id: shopId as string,
          },
        },
      };
    }

    if (sortBy) {
      criteria = {
        ...criteria,
        order: {
          [sortBy as string]: orderBy,
        },
      };
    }

    const [shopReports, count] = await reportRepository.findAndCount(criteria);

    return {
      pageSize: pageIndex && pageSize ? Number(pageSize) : null,
      pageIndex: pageIndex && pageSize ? Number(pageIndex) : null,
      count,
      totalPages: pageSize ? Math.ceil(count / Number(pageSize)) : 1,
      shopReports,
    };
  };

  static add = async ({ req, res }: { req: Request; res: Response }) => {
    const { title, body, image, shopId } = req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const userRepository = dataSource.getRepository(User);
    const reportRepository = dataSource.getRepository(AppReport);

    const roleRepository = dataSource.getRepository(Role);
    const shopRepository = dataSource.getRepository(Shop);

    const adminRole = await roleRepository.findOneBy({
      name: Equal(SystemRole.Admin),
    });

    if (!adminRole) {
      throw new NotFoundError("Admin role not found.");
    }

    const admin = await userRepository.findOneBy({
      role: {
        id: adminRole.id,
      },
    });

    if (!admin) {
      throw new NotFoundError("Admin not found.");
    }

    if (shopId) {
      const shop = await shopRepository.findOne({
        where: {
          id: shopId,
        },
      });
      if (!shop) {
        throw new NotFoundError("Shop not found.");
      }
    }

    const appReport = reportRepository.create({
      createdBy: session.userId,
      title,
      body,
      image,
      sender: session.userId,
      receiver: admin.id as any,
      isRead: false,
      shop: shopId ? shopId : undefined,
    });

    await reportRepository.save(appReport);

    return appReport;
  };
  static updateReportStatus = async ({
    req,
    res,
  }: {
    req: Request;
    res: Response;
  }) => {
    const { reportIds } = req.body;

    const { dataSource } = req.app.locals;
    const { session } = res.locals;
    const reportRepository = dataSource.getRepository(AppReport);

    const reports = await reportRepository.find({
      where: {
        id: In(reportIds),
      },
    });

    reports.forEach((report: AppReport) => {
      report.isRead = true;
    });

    await reportRepository.save(reports);

    return reports;
  };
}
