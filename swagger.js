const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    version: "1.0.0",
    title: "Meta API",
    description: "社群平台 API 文件",
  },

  // 開發時的 host
  // host: "localhost:3005", // 這裡要改

  host: "meta-wall-59ug.onrender.com",

  basePath: "/",
  schemes: ["https"],
  securityDefinitions: {
    apiKeyAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "請加上 Bearer 'Token' 以取得授權",
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
