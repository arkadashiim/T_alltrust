import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "AllTrust Payment Service",
      version: "1.0.0",
      description: "Сервис приёма платежей: инвойсы, комиссии, вебхуки",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerDocument = swaggerJsdoc(options);
