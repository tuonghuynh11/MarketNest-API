import { createServer } from "http";
import "reflect-metadata";
import { Server } from "socket.io";

import application from "./application";
import Logger from "./utils/logger";
import config from "./configuration";
import { AppDataSource } from "./database/data-source";
import { createTransport } from "nodemailer";
import configuration from "./configuration";
const { instance: app } = application;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      configuration.clientSite,
      configuration.adminSite,
      configuration.shopkeeperSite,
      "http://localhost:5173",
    ],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  app.locals.socket = socket;

  Logger.info(`Socket.IO start with id: ${socket.id}`);
  socket.on("disconnect", (reason) => {
    Logger.info(`Socket.IO end by ${reason}`);
  });
});

httpServer.listen(config.port, () => {
  Logger.info(`Server is listening on :${config.port}`);
});
app.locals.io = io;

AppDataSource.initialize()
  .then(() => {
    Logger.info("Data Source has been initialized!");
  })
  .catch((error) => {
    Logger.error("Error during Data Source initialization:", error);
  });
app.locals.dataSource = AppDataSource;

const nodeMailer = createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPassword,
  },
});
app.locals.nodeMailer = nodeMailer;

///Hello world
