import "express";
import { Transporter } from "nodemailer";
import { Server } from "socket.io";
import { DataSource } from "typeorm";

declare global {
  namespace Express {
    interface Locals {
      dataSource: DataSource;
      io: Server;
      nodeMailer: Transporter;
    }
  }
}
